import type { Tables } from "@/app/types/database.types"

export type IdeationSession = Tables<"ideation_sessions">
export type IdeationAgentResult = Tables<"ideation_agent_results">

export type AgentType =
  | "market_research"
  | "competition"
  | "technical_feasibility"
  | "uniqueness"
  | "monetization"

export type IdeationStatus = "pending" | "processing" | "completed" | "failed"

export interface AgentConfig {
  type: AgentType
  name: string
  description: string
  systemPrompt: string
  weight: number
}

export interface IdeationInput {
  title: string
  idea: string
  additionalContext?: string
}

export interface AgentAnalysis {
  score: number
  analysis: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

export interface IdeationResult {
  session: IdeationSession
  agentResults: IdeationAgentResult[]
  overallScore: number
  recommendation: string
}

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    type: "market_research",
    name: "Market Research Agent",
    description: "Analyzes market size, trends, and potential demand",
    weight: 0.25,
    systemPrompt: `You are a Market Research Expert. Analyze the given project idea and provide:
1. Market size estimation (TAM, SAM, SOM)
2. Current market trends relevant to this idea
3. Target audience analysis
4. Demand validation indicators
5. Growth potential assessment

Provide a score from 1-10 based on market viability.
Format your response as JSON with the following structure:
{
  "score": number,
  "analysis": "detailed analysis text",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}`,
  },
  {
    type: "competition",
    name: "Competition Analysis Agent",
    description: "Evaluates competitive landscape and differentiation",
    weight: 0.2,
    systemPrompt: `You are a Competitive Analysis Expert. Analyze the given project idea and provide:
1. Direct and indirect competitors
2. Competitive advantages and disadvantages
3. Market positioning opportunities
4. Barriers to entry
5. Differentiation potential

Provide a score from 1-10 based on competitive viability.
Format your response as JSON with the following structure:
{
  "score": number,
  "analysis": "detailed analysis text",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}`,
  },
  {
    type: "technical_feasibility",
    name: "Technical Feasibility Agent",
    description: "Assesses technical requirements and implementation challenges",
    weight: 0.2,
    systemPrompt: `You are a Technical Feasibility Expert. Analyze the given project idea and provide:
1. Technical requirements and stack recommendations
2. Development complexity assessment
3. Scalability considerations
4. Technical risks and challenges
5. Resource requirements (team, infrastructure)

Provide a score from 1-10 based on technical feasibility.
Format your response as JSON with the following structure:
{
  "score": number,
  "analysis": "detailed analysis text",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}`,
  },
  {
    type: "uniqueness",
    name: "Uniqueness & Innovation Agent",
    description: "Evaluates novelty and innovation potential",
    weight: 0.15,
    systemPrompt: `You are an Innovation Expert. Analyze the given project idea and provide:
1. Uniqueness assessment (how novel is this idea?)
2. Innovation potential
3. Intellectual property considerations
4. First-mover advantage potential
5. Defensibility of the concept

Provide a score from 1-10 based on uniqueness and innovation.
Format your response as JSON with the following structure:
{
  "score": number,
  "analysis": "detailed analysis text",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}`,
  },
  {
    type: "monetization",
    name: "Monetization & Business Model Agent",
    description: "Analyzes revenue potential and business sustainability",
    weight: 0.2,
    systemPrompt: `You are a Business Model Expert. Analyze the given project idea and provide:
1. Revenue model options
2. Pricing strategy recommendations
3. Unit economics potential
4. Path to profitability
5. Funding requirements and investor appeal

Provide a score from 1-10 based on monetization potential.
Format your response as JSON with the following structure:
{
  "score": number,
  "analysis": "detailed analysis text",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}`,
  },
]
