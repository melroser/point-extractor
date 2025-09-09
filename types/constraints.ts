
// types/constraints.ts
export interface Constraint {
  id: string
  text: string
  sourceStart: number
  sourceEnd: number
  category?: string
}

export interface RedundantGroup {
  id: string
  constraints: Constraint[]
  similarity: number
}

export interface Contradiction {
  id: string
  constraint1: Constraint
  constraint2: Constraint
  explanation: string
  confidence: number
}

export interface AnalysisResult {
  constraints: Constraint[]
  redundantGroups: RedundantGroup[]
  contradictions: Contradiction[]
  originalText: string
}
