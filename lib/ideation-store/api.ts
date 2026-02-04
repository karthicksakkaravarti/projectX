import { createClient } from "@/lib/supabase/client"
import type {
  AgentType,
  IdeationInput,
  IdeationSession,
  IdeationAgentResult,
  IdeationStatus,
  AgentAnalysis,
} from "./types"

function getSupabase() {
  const supabase = createClient()
  if (!supabase) {
    throw new Error("Supabase is not enabled")
  }
  return supabase
}

export async function createIdeationSession(
  userId: string,
  input: IdeationInput
): Promise<IdeationSession> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("ideation_sessions")
    .insert({
      user_id: userId,
      title: input.title,
      idea: input.idea,
      status: "pending" as IdeationStatus,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create ideation session: ${error.message}`)
  return data as IdeationSession
}

export async function updateIdeationSessionStatus(
  sessionId: string,
  status: IdeationStatus,
  overallScore?: number,
  recommendation?: string
): Promise<void> {
  const supabase = getSupabase()
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (overallScore !== undefined) {
    updateData.overall_score = overallScore
  }

  if (recommendation !== undefined) {
    updateData.recommendation = recommendation
  }

  const { error } = await supabase
    .from("ideation_sessions")
    .update(updateData)
    .eq("id", sessionId)

  if (error) throw new Error(`Failed to update session status: ${error.message}`)
}

export async function createAgentResult(
  sessionId: string,
  agentType: AgentType
): Promise<IdeationAgentResult> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("ideation_agent_results")
    .insert({
      session_id: sessionId,
      agent_type: agentType,
      status: "pending" as IdeationStatus,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create agent result: ${error.message}`)
  return data as IdeationAgentResult
}

export async function updateAgentResult(
  resultId: string,
  status: IdeationStatus,
  analysis?: AgentAnalysis,
  rawResponse?: unknown
): Promise<void> {
  const supabase = getSupabase()
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (analysis) {
    updateData.score = analysis.score
    updateData.analysis = analysis.analysis
    updateData.strengths = analysis.strengths
    updateData.weaknesses = analysis.weaknesses
    updateData.recommendations = analysis.recommendations
  }

  if (rawResponse !== undefined) {
    updateData.raw_response = rawResponse
  }

  const { error } = await supabase
    .from("ideation_agent_results")
    .update(updateData)
    .eq("id", resultId)

  if (error) throw new Error(`Failed to update agent result: ${error.message}`)
}

export async function getIdeationSession(
  sessionId: string
): Promise<IdeationSession | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("ideation_sessions")
    .select()
    .eq("id", sessionId)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(`Failed to get session: ${error.message}`)
  }
  return data as IdeationSession
}

export async function getAgentResults(
  sessionId: string
): Promise<IdeationAgentResult[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("ideation_agent_results")
    .select()
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(`Failed to get agent results: ${error.message}`)
  return (data || []) as IdeationAgentResult[]
}

export async function getUserIdeationSessions(
  userId: string
): Promise<IdeationSession[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("ideation_sessions")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to get user sessions: ${error.message}`)
  return (data || []) as IdeationSession[]
}

export async function deleteIdeationSession(sessionId: string): Promise<void> {
  const supabase = getSupabase()
  // First delete agent results
  await supabase
    .from("ideation_agent_results")
    .delete()
    .eq("session_id", sessionId)

  // Then delete the session
  const { error } = await supabase
    .from("ideation_sessions")
    .delete()
    .eq("id", sessionId)

  if (error) throw new Error(`Failed to delete session: ${error.message}`)
}
