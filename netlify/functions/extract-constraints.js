// netlify/functions/extract-constraints.js
const { v4: uuidv4 } = require('uuid');

const AI_PROVIDERS = {
    'xAI (Grok)': {
        endpoint: 'https://api.x.ai/v1/chat/completions',
        model: 'grok-3',
        envKey: 'XAI_API_KEY',
        headers: (apiKey) => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        }),
        body: (model, messages) => ({ model, messages }),
        parseResponse: (data) => data.choices[0].message.content,
    },
    'OpenAI': {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o-mini',
        envKey: 'OPENAI_API_KEY',
        headers: (apiKey) => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        }),
        body: (model, messages) => ({ model, messages }),
        parseResponse: (data) => data.choices[0].message.content,
    },
    'Anthropic (Claude)': {
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-haiku-20240307',
        envKey: 'ANTHROPIC_API_KEY',
        headers: (apiKey) => ({
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        }),
        body: (model, messages) => ({
            model,
            max_tokens: 2000,
            messages: messages.filter(m => m.role !== 'system'),
            system: messages.find(m => m.role === 'system')?.content || '',
        }),
        parseResponse: (data) => data.content[0].text,
    },
    'Google (Gemini)': {
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        model: 'gemini-1.5-flash',
        envKey: 'GOOGLE_API_KEY',
        headers: (apiKey) => ({
            'Content-Type': 'application/json',
        }),
        body: (model, messages) => ({
            contents: [{
                parts: [{
                    text: messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
                }]
            }]
        }),
        parseResponse: (data) => data.candidates[0].content.parts[0].text,
    },
    'Cohere': {
        endpoint: 'https://api.cohere.ai/v1/chat',
        model: 'command-r-plus',
        envKey: 'COHERE_API_KEY',
        headers: (apiKey) => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        }),
        body: (model, messages) => ({
            model,
            message: messages[messages.length - 1].content,
            preamble: messages.find(m => m.role === 'system')?.content || '',
        }),
        parseResponse: (data) => data.text,
    },
};

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const { providerName, inputText } = JSON.parse(event.body);

        const provider = AI_PROVIDERS[providerName];
        if (!provider) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ error: 'Invalid provider' }),
            };
        }

        const apiKey = process.env[provider.envKey];
        if (!apiKey) {
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ error: `${providerName} API key not configured` }),
            };
        }

        // Enhanced prompt for comprehensive analysis
        const enhancedPrompt = `Analyze the following text and provide a comprehensive constraint analysis.

Text: "${inputText}"

Please return ONLY a valid JSON response with this exact structure:
{
  "constraints": [
    {
      "id": "unique-id",
      "text": "constraint text",
      "sourceStart": 0,
      "sourceEnd": 10
    }
  ],
  "redundantGroups": [
    {
      "id": "group-id",
      "constraints": [constraint objects from above],
      "similarity": 0.85
    }
  ],
  "contradictions": [
    {
      "id": "contradiction-id",
      "constraint1": constraint object,
      "constraint2": constraint object,
      "explanation": "why they contradict",
      "confidence": 0.9
    }
  ],
  "originalText": "${inputText.replace(/"/g, '\\"')}"
}

Rules:
1. Extract all constraints/requirements/rules from the text
2. Identify groups of constraints that say essentially the same thing (redundant)
3. Find constraints that directly contradict each other
4. Provide source positions (character indices) for highlighting in original text
5. Include confidence scores for contradictions (0-1)
6. Include similarity scores for redundant groups (0-1)
7. Generate unique IDs for all objects
8. Return ONLY valid JSON, no additional text or formatting`;

        const messages = [
            {
                role: 'system',
                content: 'You are a helpful assistant that analyzes text for constraints, redundancies, and contradictions. Always respond with valid JSON only.',
            },
            {
                role: 'user',
                content: enhancedPrompt,
            },
        ];

        let url = provider.endpoint;
        if (providerName === 'Google (Gemini)') {
            url += `?key=${apiKey}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: provider.headers(apiKey),
            body: JSON.stringify(provider.body(provider.model, messages)),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        let aiOutput = provider.parseResponse(data).trim();

        // Clean up the AI response to extract JSON
        if (aiOutput.includes('```json')) {
            aiOutput = aiOutput.split('```json')[1].split('```')[0].trim();
        } else if (aiOutput.includes('```')) {
            aiOutput = aiOutput.split('```')[1].split('```')[0].trim();
        }

        let analysisResult;
        try {
            analysisResult = JSON.parse(aiOutput);
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', aiOutput);
            
            // Fallback: create a basic analysis result
            const basicConstraints = aiOutput
                .split('\n')
                .filter(line => line.trim().match(/^[-*•]/))
                .map((line, index) => ({
                    id: uuidv4(),
                    text: line.replace(/^[-*•]\s/, '').trim(),
                    sourceStart: 0,
                    sourceEnd: inputText.length
                }));

            analysisResult = {
                constraints: basicConstraints,
                redundantGroups: [],
                contradictions: [],
                originalText: inputText
            };
        }

        // Ensure all required properties exist
        analysisResult = {
            constraints: analysisResult.constraints || [],
            redundantGroups: analysisResult.redundantGroups || [],
            contradictions: analysisResult.contradictions || [],
            originalText: analysisResult.originalText || inputText
        };

        // Add IDs if missing
        analysisResult.constraints = analysisResult.constraints.map(constraint => ({
            ...constraint,
            id: constraint.id || uuidv4(),
            sourceStart: constraint.sourceStart || 0,
            sourceEnd: constraint.sourceEnd || inputText.length
        }));

        analysisResult.redundantGroups = analysisResult.redundantGroups.map(group => ({
            ...group,
            id: group.id || uuidv4(),
            similarity: group.similarity || 0.8
        }));

        analysisResult.contradictions = analysisResult.contradictions.map(contradiction => ({
            ...contradiction,
            id: contradiction.id || uuidv4(),
            confidence: contradiction.confidence || 0.8
        }));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: JSON.stringify(analysisResult),
        };

    } catch (error) {
        console.error('Handler error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ 
                error: error.message || 'Internal server error',
                constraints: [],
                redundantGroups: [],
                contradictions: [],
                originalText: ''
            }),
        };
    }
};