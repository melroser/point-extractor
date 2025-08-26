"use client"

import { motion } from 'framer-motion'
import { Loader2, Send, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface Constraint {
  text: string
}

interface AIProvider {
  name: string
  endpoint: string
  model: string
  headers: (apiKey: string) => Record<string, string>
  body: (model: string, messages: any[]) => any
  parseResponse: (data: any) => string
}

const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'xAI (Grok)',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-beta',
    headers: (apiKey: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
    body: (model: string, messages: any[]) => ({
      model,
      messages,
    }),
    parseResponse: (data: any) => data.choices[0].message.content,
  },
  {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    headers: (apiKey: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
    body: (model: string, messages: any[]) => ({
      model,
      messages,
    }),
    parseResponse: (data: any) => data.choices[0].message.content,
  },
  {
    name: 'Anthropic (Claude)',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307',
    headers: (apiKey: string) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }),
    body: (model: string, messages: any[]) => ({
      model,
      max_tokens: 1000,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content || '',
    }),
    parseResponse: (data: any) => data.content[0].text,
  },
  {
    name: 'Google (Gemini)',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    model: 'gemini-1.5-flash',
    headers: (apiKey: string) => ({
      'Content-Type': 'application/json',
    }),
    body: (model: string, messages: any[]) => ({
      contents: [{
        parts: [{
          text: messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
        }]
      }]
    }),
    parseResponse: (data: any) => data.candidates[0].content.parts[0].text,
  },
  {
    name: 'Cohere',
    endpoint: 'https://api.cohere.ai/v1/chat',
    model: 'command-r-plus',
    headers: (apiKey: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
    body: (model: string, messages: any[]) => ({
      model,
      message: messages[messages.length - 1].content,
      preamble: messages.find(m => m.role === 'system')?.content || '',
    }),
    parseResponse: (data: any) => data.text,
  },
]

export default function ConstraintExtractor() {
  const [inputText, setInputText] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AI_PROVIDERS[0])
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !apiKey.trim()) return

    setLoading(true)
    setError(null)
    setConstraints([])

    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts specific constraints from a given paragraph of text. Respond only with a bulleted list of the constraints, nothing else. Correct any spelling errors in the extraction.',
        },
        {
          role: 'user',
          content: `Extract the specific constraints from this paragraph as a bulleted list: ${inputText}`,
        },
      ]

      let url = selectedProvider.endpoint
      if (selectedProvider.name === 'Google (Gemini)') {
        url += `?key=${apiKey}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: selectedProvider.headers(apiKey),
        body: JSON.stringify(selectedProvider.body(selectedProvider.model, messages)),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`)
      }

      const data = await response.json()
      const output = selectedProvider.parseResponse(data).trim()
      const lines = output.split('\n').filter((line: string) => line.trim().match(/^[-*•]\s/))
      setConstraints(lines.map((line: string) => ({ 
        text: line.replace(/^[-*•]\s/, '').trim() 
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract constraints. Please check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8"
      >
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Point Extractor</h1>
        <p> Use this tool to extract constraints from a paragraph. Helpfull when writing complex prompts that need to do specific things reliably. </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>{selectedProvider.name}</span>
              <ChevronDown className={`transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} size={20} />
            </button>
            
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/10 rounded-xl shadow-xl z-10"
              >
                {AI_PROVIDERS.map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(provider)
                      setDropdownOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 first:rounded-t-xl last:rounded-b-xl transition-colors"
                  >
                    {provider.name}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <input
            type="password"
            placeholder={`Enter your ${selectedProvider.name} API Key`}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <textarea
            placeholder="Enter your paragraph here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
          
          <button
            type="submit"
            disabled={loading || !inputText.trim() || !apiKey.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            {loading ? 'Extracting...' : 'Extract Constraints'}
          </button>
        </form>
        
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 mt-4 text-center text-sm"
          >
            {error}
          </motion.p>
        )}
        
        {constraints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6"
          >
            <h2 className="text-xl font-semibold text-white mb-3">Extracted Constraints:</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-200">
              {constraints.map((constraint, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {constraint.text}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}


