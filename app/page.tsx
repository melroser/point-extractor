// app/page.tsx
"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Send, ChevronDown, AlertTriangle, Copy, Eye } from 'lucide-react'
import { useState } from 'react'

interface Constraint {
    id: string
    text: string
    sourceStart: number
    sourceEnd: number
}

interface RedundantGroup {
    id: string
    constraints: Constraint[]
    similarity: number
}

interface Contradiction {
    id: string
    constraint1: Constraint
    constraint2: Constraint
    explanation: string
    confidence: number
}

interface AnalysisResult {
    constraints: Constraint[]
    redundantGroups: RedundantGroup[]
    contradictions: Contradiction[]
    originalText: string
}

const AI_PROVIDERS = [
    'xAI (Grok)',
    'OpenAI',
    'Anthropic (Claude)',
    'Google (Gemini)',
    'Cohere',
]

export default function ConstraintExtractor() {
    const [inputText, setInputText] = useState<string>('')
    const [selectedProvider, setSelectedProvider] = useState<string>(AI_PROVIDERS[0])
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)
    const [showOriginalText, setShowOriginalText] = useState<boolean>(true)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputText.trim()) return

        setLoading(true)
        setError(null)
        setAnalysisResult(null)

        try {
            const baseUrl = process.env.NODE_ENV === 'development' 
                ? 'http://localhost:8888/.netlify/functions' 
                : '/.netlify/functions';

            const response = await fetch(`${baseUrl}/extract-constraints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    providerName: selectedProvider,
                    inputText: inputText,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`)
            }

            setAnalysisResult(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to extract constraints. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const getHighlightedText = () => {
        if (!analysisResult) return inputText

        let highlightedText = analysisResult.originalText
        const highlights: Array<{start: number, end: number, type: 'constraint' | 'redundant', id: string}> = []

        // Add constraint highlights
        analysisResult.constraints.forEach(constraint => {
            highlights.push({
                start: constraint.sourceStart,
                end: constraint.sourceEnd,
                type: 'constraint',
                id: constraint.id
            })
        })

        // Add redundant highlights
        analysisResult.redundantGroups.forEach(group => {
            group.constraints.forEach(constraint => {
                const existingIndex = highlights.findIndex(h => h.id === constraint.id)
                if (existingIndex >= 0) {
                    highlights[existingIndex].type = 'redundant'
                }
            })
        })

        // Sort by start position (descending) to avoid offset issues
        highlights.sort((a, b) => b.start - a.start)

        // Apply highlights
        highlights.forEach(highlight => {
            const before = highlightedText.substring(0, highlight.start)
            const text = highlightedText.substring(highlight.start, highlight.end)
            const after = highlightedText.substring(highlight.end)
            
            const className = highlight.type === 'redundant' 
                ? 'bg-yellow-400/30 border-b-2 border-yellow-400' 
                : 'bg-green-400/30 border-b-2 border-green-400'
            
            highlightedText = `${before}<span class="${className}" title="${highlight.type === 'redundant' ? 'Redundant constraint' : 'Extracted constraint'}">${text}</span>${after}`
        })

        return highlightedText
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 font-sans">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 mb-6"
                >
                    <h1 className="text-3xl font-bold text-white mb-6 text-center">Enhanced Constraint Analyzer</h1>
                    <p className="text-gray-300 mb-6 text-center">
                        Extract constraints, identify redundancies, and detect contradictions with visual highlighting.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <span>{selectedProvider}</span>
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
                                            key={provider}
                                            type="button"
                                            onClick={() => {
                                                setSelectedProvider(provider)
                                                setDropdownOpen(false)
                                            }}
                                            className="w-full px-4 py-2 text-left text-white hover:bg-white/10 first:rounded-t-xl last:rounded-b-xl transition-colors"
                                        >
                                            {provider}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        <textarea
                            placeholder="Enter your paragraph here..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        />

                        <button
                            type="submit"
                            disabled={loading || !inputText.trim()}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            {loading ? 'Analyzing...' : 'Analyze Constraints'}
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
                </motion.div>

                {analysisResult && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Original Text with Highlights */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">Original Text</h2>
                                <button
                                    onClick={() => setShowOriginalText(!showOriginalText)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <Eye size={20} />
                                </button>
                            </div>
                            
                            <AnimatePresence>
                                {showOriginalText && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-gray-200 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
                                    />
                                )}
                            </AnimatePresence>

                            <div className="mt-4 flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-400/30 border border-green-400 rounded"></div>
                                    <span className="text-gray-300">Extracted Constraints</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-400/30 border border-yellow-400 rounded"></div>
                                    <span className="text-gray-300">Redundant Constraints</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Analysis Results */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6"
                        >
                            <h2 className="text-xl font-semibold text-white mb-4">Analysis Results</h2>
                            
                            {/* Constraints */}
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                                    Extracted Constraints
                                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                        {analysisResult.constraints.length}
                                    </span>
                                </h3>
                                <ul className="space-y-2">
                                    {analysisResult.constraints.map((constraint, index) => (
                                        <motion.li
                                            key={constraint.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-start gap-2 text-gray-200"
                                        >
                                            <span className="text-blue-400 mt-1">•</span>
                                            <span className="flex-1">{constraint.text}</span>
                                            <button
                                                onClick={() => copyToClipboard(constraint.text)}
                                                className="text-gray-400 hover:text-white transition-colors"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>

                            {/* Redundant Groups */}
                            {analysisResult.redundantGroups.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-yellow-400 mb-3 flex items-center gap-2">
                                        Redundant Constraints
                                        <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                                            {analysisResult.redundantGroups.length}
                                        </span>
                                    </h3>
                                    {analysisResult.redundantGroups.map((group, index) => (
                                        <motion.div
                                            key={group.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3 mb-3"
                                        >
                                            <div className="text-yellow-300 text-sm mb-2">
                                                Similarity: {Math.round(group.similarity * 100)}%
                                            </div>
                                            {group.constraints.map((constraint) => (
                                                <div key={constraint.id} className="text-gray-200 text-sm mb-1">
                                                    • {constraint.text}
                                                </div>
                                            ))}
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Contradictions */}
                            {analysisResult.contradictions.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-medium text-red-400 mb-3 flex items-center gap-2">
                                        <AlertTriangle size={20} />
                                        Contradictions
                                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                                            {analysisResult.contradictions.length}
                                        </span>
                                    </h3>
                                    {analysisResult.contradictions.map((contradiction, index) => (
                                        <motion.div
                                            key={contradiction.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-red-400/10 border border-red-400/20 rounded-lg p-4 mb-4"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                <div className="bg-red-500/20 p-3 rounded border-l-4 border-red-500">
                                                    <div className="text-red-300 text-xs mb-1">CONSTRAINT A</div>
                                                    <div className="text-gray-200 text-sm">{contradiction.constraint1.text}</div>
                                                </div>
                                                <div className="bg-red-500/20 p-3 rounded border-l-4 border-red-500">
                                                    <div className="text-red-300 text-xs mb-1">CONSTRAINT B</div>
                                                    <div className="text-gray-200 text-sm">{contradiction.constraint2.text}</div>
                                                </div>
                                            </div>
                                            <div className="text-red-300 text-sm">
                                                <strong>Why they contradict:</strong> {contradiction.explanation}
                                            </div>
                                            <div className="text-red-400 text-xs mt-2">
                                                Confidence: {Math.round(contradiction.confidence * 100)}%
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    )
}
