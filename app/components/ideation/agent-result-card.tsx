"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { IdeationAgentResult } from "@/lib/ideation-store"
import { AGENT_CONFIGS } from "@/lib/ideation-store/types"
import {
  ChartBar,
  CheckCircle,
  Code,
  Lightbulb,
  Lightning,
  Money,
  Spinner,
  Users,
  Warning,
  XCircle,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface AgentResultCardProps {
  result: IdeationAgentResult
}

const agentIcons: Record<string, React.ElementType> = {
  market_research: ChartBar,
  competition: Users,
  technical_feasibility: Code,
  uniqueness: Lightbulb,
  monetization: Money,
}

const statusIcons: Record<string, React.ElementType> = {
  pending: Spinner,
  processing: Spinner,
  completed: CheckCircle,
  failed: XCircle,
}

const statusColors: Record<string, string> = {
  pending: "text-muted-foreground",
  processing: "text-blue-500 animate-spin",
  completed: "text-green-500",
  failed: "text-red-500",
}

function getScoreColor(score: number): string {
  if (score >= 8) return "text-green-500"
  if (score >= 6) return "text-yellow-500"
  if (score >= 4) return "text-orange-500"
  return "text-red-500"
}

function getProgressColor(score: number): string {
  if (score >= 8) return "bg-green-500"
  if (score >= 6) return "bg-yellow-500"
  if (score >= 4) return "bg-orange-500"
  return "bg-red-500"
}

export function AgentResultCard({ result }: AgentResultCardProps) {
  const config = AGENT_CONFIGS.find((c) => c.type === result.agent_type)
  const Icon = agentIcons[result.agent_type] || Lightbulb
  const StatusIcon = statusIcons[result.status] || Spinner
  const isComplete = result.status === "completed"

  const strengths = Array.isArray(result.strengths) ? result.strengths : []
  const weaknesses = Array.isArray(result.weaknesses) ? result.weaknesses : []
  const recommendations = Array.isArray(result.recommendations)
    ? result.recommendations
    : []

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="size-5" />
            {config?.name || result.agent_type}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isComplete && result.score !== null && (
              <span className={cn("text-2xl font-bold", getScoreColor(result.score))}>
                {result.score}/10
              </span>
            )}
            <StatusIcon className={cn("size-5", statusColors[result.status])} />
          </div>
        </div>
        {config?.description && (
          <p className="text-sm text-muted-foreground">{config.description}</p>
        )}
      </CardHeader>

      {isComplete && (
        <CardContent className="space-y-4">
          {result.score !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Score</span>
                <span>{result.score}/10</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn("h-full transition-all", getProgressColor(result.score))}
                  style={{ width: `${(result.score / 10) * 100}%` }}
                />
              </div>
            </div>
          )}

          {result.analysis && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Analysis</h4>
              <p className="text-sm text-muted-foreground">{result.analysis}</p>
            </div>
          )}

          {strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Lightning className="size-4 text-green-500" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {strengths.map((strength, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <CheckCircle className="size-4 text-green-500 mt-0.5 shrink-0" />
                    {String(strength)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {weaknesses.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Warning className="size-4 text-orange-500" />
                Weaknesses
              </h4>
              <ul className="space-y-1">
                {weaknesses.map((weakness, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <XCircle className="size-4 text-orange-500 mt-0.5 shrink-0" />
                    {String(weakness)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Lightbulb className="size-4 text-blue-500" />
                Recommendations
              </h4>
              <ul className="space-y-1">
                {recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <Badge variant="outline" className="shrink-0">
                      {i + 1}
                    </Badge>
                    {String(rec)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}

      {result.status === "processing" && (
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4 animate-spin" />
            Analyzing...
          </div>
        </CardContent>
      )}

      {result.status === "failed" && (
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-red-500">
            <XCircle className="size-4" />
            Analysis failed
          </div>
        </CardContent>
      )}
    </Card>
  )
}
