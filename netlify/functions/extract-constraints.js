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
      max_tokens: 1000,
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

const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { providerName, inputText } = JSON.parse(event.body);
    
    const provider = AI_PROVIDERS[providerName];
    if (!provider) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid provider' }),
      };
    }

    const apiKey = process.env[provider.envKey];
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `${providerName} API key not configured` }),
      };
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant that extracts specific constraints from a given paragraph of text. Respond only with a bulleted list of the constraints, nothing else. Correct any spelling errors in the extraction.',
      },
      {
        role: 'user',
        content: `Extract the specific constraints from this paragraph as a bulleted list: ${inputText}`,
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
    const output = provider.parseResponse(data).trim();
    const lines = output.split('\n').filter(line => line.trim().match(/^[-*•]\s/));
    const constraints = lines.map(line => ({ 
      text: line.replace(/^[-*•]\s/, '').trim() 
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ constraints }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

module.exports = { handler };
