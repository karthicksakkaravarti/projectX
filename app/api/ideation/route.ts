import { createClient } from "@/lib/supabase/server"
import { generateText, LanguageModelV1 } from "ai"
import { getAllModels } from "@/lib/models"
import { getProviderForModel } from "@/lib/openproviders/provider-map"
import type { ProviderWithoutOllama } from "@/lib/user-keys"
import {
  AGENT_CONFIGS,
  type AgentAnalysis,
  type AgentType,
  type IdeationInput,
} from "@/lib/ideation-store/types"

export const maxDuration = 120

const DEFAULT_MODEL = "gpt-4.1-mini"

interface IdeationRequest {
  userId: string
  input: IdeationInput
}

function parseAgentResponse(response: string): AgentAnalysis {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        score: Math.min(10, Math.max(1, Number(parsed.score) || 5)),
        analysis: parsed.analysis || "Analysis not available",
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      }
    }
  } catch {
    // If JSON parsing fails, extract what we can
  }

  // Fallback: return a default structure
  return {
    score: 5,
    analysis: response,
    strengths: [],
    weaknesses: [],
    recommendations: [],
  }
}

function generateRecommendation(score: number): string {
  if (score >= 8) {
    return "Highly Recommended - This idea shows strong potential across all evaluation criteria. Consider moving forward with detailed planning and validation."
  } else if (score >= 6) {
    return "Recommended with Considerations - This idea has merit but requires attention to the identified weaknesses. Address the key concerns before significant investment."
  } else if (score >= 4) {
    return "Needs Refinement - The idea has some potential but significant challenges exist. Consider pivoting or addressing major concerns before proceeding."
  } else {
    return "Not Recommended - The idea faces substantial challenges across multiple dimensions. Consider alternative approaches or significant modifications."
  }
}

async function runAgent(
  agentConfig: (typeof AGENT_CONFIGS)[number],
  idea: string,
  title: string,
  model: LanguageModelV1,
  additionalContext?: string
): Promise<AgentAnalysis> {
  const userPrompt = `
Project Title: ${title}

Project Idea:
${idea}

${additionalContext ? `Additional Context:\n${additionalContext}` : ""}

Please analyze this project idea thoroughly and provide your assessment.
`

  try {
    const result = await generateText({
      model,
      system: agentConfig.systemPrompt,
      prompt: userPrompt,
      maxTokens: 2000,
    })

    return parseAgentResponse(result.text)
  } catch (error) {
    console.error(`Agent ${agentConfig.type} failed:`, error)
    return {
      score: 0,
      analysis: `Agent analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      strengths: [],
      weaknesses: [],
      recommendations: [],
    }
  }
}

export async function POST(req: Request) {
  try {
    const { userId, input } = (await req.json()) as IdeationRequest

    if (!userId || !input?.title || !input?.idea) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, title, or idea" }),
        { status: 400 }
      )
    }

    const supabase = await createClient()

    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Database connection failed" }),
        { status: 500 }
      )
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      )
    }

    // Create ideation session
    const { data: session, error: sessionError } = await supabase
      .from("ideation_sessions")
      .insert({
        user_id: userId,
        title: input.title,
        idea: input.idea,
        status: "processing",
      })
      .select()
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Failed to create ideation session" }),
        { status: 500 }
      )
    }

    // Get model configuration
    const allModels = await getAllModels()
    const modelConfig = allModels.find((m) => m.id === DEFAULT_MODEL)

    if (!modelConfig || !modelConfig.apiSdk) {
      return new Response(
        JSON.stringify({ error: `Model ${DEFAULT_MODEL} not found` }),
        { status: 500 }
      )
    }

    // Get API key if available
    let apiKey: string | undefined
    try {
      const { getEffectiveApiKey } = await import("@/lib/user-keys")
      const provider = getProviderForModel(DEFAULT_MODEL)
      apiKey =
        (await getEffectiveApiKey(userId, provider as ProviderWithoutOllama)) ||
        undefined
    } catch {
      // Use environment key
    }

    const model = modelConfig.apiSdk(apiKey)

    // Create agent result records
    const agentResultPromises = AGENT_CONFIGS.map(async (config) => {
      const { data, error } = await supabase
        .from("ideation_agent_results")
        .insert({
          session_id: session.id,
          agent_type: config.type,
          status: "processing",
        })
        .select()
        .single()

      if (error) {
        console.error(`Failed to create agent result for ${config.type}:`, error)
        return null
      }
      return { id: data.id, config }
    })

    const agentResults = (await Promise.all(agentResultPromises)).filter(Boolean) as {
      id: string
      config: (typeof AGENT_CONFIGS)[number]
    }[]

    // Run all agents in parallel
    const analysisPromises = agentResults.map(async ({ id, config }) => {
      const analysis = await runAgent(
        config,
        input.idea,
        input.title,
        model,
        input.additionalContext
      )

      // Update the agent result in the database
      await supabase
        .from("ideation_agent_results")
        .update({
          status: analysis.score > 0 ? "completed" : "failed",
          score: analysis.score,
          analysis: analysis.analysis,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          recommendations: analysis.recommendations,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      return { type: config.type as AgentType, analysis, weight: config.weight }
    })

    const analyses = await Promise.all(analysisPromises)

    // Calculate weighted overall score
    let totalWeight = 0
    let weightedScore = 0

    for (const { analysis, weight } of analyses) {
      if (analysis.score > 0) {
        weightedScore += analysis.score * weight
        totalWeight += weight
      }
    }

    const overallScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 10) / 10 : 0
    const recommendation = generateRecommendation(overallScore)

    // Update session with final results
    await supabase
      .from("ideation_sessions")
      .update({
        status: "completed",
        overall_score: overallScore,
        recommendation,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id)

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        overallScore,
        recommendation,
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error in /api/ideation:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 }
    )
  }
}
