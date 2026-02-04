"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useIdeation } from "@/lib/ideation-store"
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Lightbulb,
  Spinner,
  Target,
  Trophy,
  Warning,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useEffect } from "react"
import { AgentResultCard } from "./agent-result-card"

function getScoreColor(score: number): string {
  if (score >= 8) return "text-green-500"
  if (score >= 6) return "text-yellow-500"
  if (score >= 4) return "text-orange-500"
  return "text-red-500"
}

function getScoreBgColor(score: number): string {
  if (score >= 8) return "bg-green-500/10 border-green-500/20"
  if (score >= 6) return "bg-yellow-500/10 border-yellow-500/20"
  if (score >= 4) return "bg-orange-500/10 border-orange-500/20"
  return "bg-red-500/10 border-red-500/20"
}

function getRecommendationIcon(score: number): React.ElementType {
  if (score >= 8) return Trophy
  if (score >= 6) return CheckCircle
  if (score >= 4) return Warning
  return Target
}

export function IdeationResults() {
  const { currentSession, currentAgentResults, isLoading, refreshCurrentSession } = useIdeation()

  // Poll for updates while processing
  useEffect(() => {
    if (currentSession?.status === "processing") {
      const interval = setInterval(() => {
        refreshCurrentSession()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [currentSession?.status, refreshCurrentSession])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!currentSession) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Session not found</p>
          <Link href="/ideation">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="size-4" />
              Back to Ideation
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const isProcessing = currentSession.status === "processing"
  const isCompleted = currentSession.status === "completed"
  const score = currentSession.overall_score || 0
  const RecommendationIcon = getRecommendationIcon(score)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ideation">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="size-5" />
                {currentSession.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Clock className="size-4" />
                {new Date(currentSession.created_at || "").toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge
              variant={isProcessing ? "secondary" : isCompleted ? "default" : "destructive"}
            >
              {isProcessing && <Spinner className="size-3 animate-spin mr-1" />}
              {currentSession.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {currentSession.idea}
          </p>
        </CardContent>
      </Card>

      {/* Overall Score */}
      {isCompleted && currentSession.overall_score !== null && (
        <Card className={cn("border-2", getScoreBgColor(score))}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <RecommendationIcon className={cn("size-6", getScoreColor(score))} />
                Overall Assessment
              </span>
              <span className={cn("text-4xl font-bold", getScoreColor(score))}>
                {score}/10
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{currentSession.recommendation}</p>
          </CardContent>
        </Card>
      )}

      {/* Processing State */}
      {isProcessing && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <Spinner className="size-6 animate-spin text-blue-500" />
              <div>
                <p className="font-medium">Analyzing your idea...</p>
                <p className="text-sm text-muted-foreground">
                  Our AI agents are researching and evaluating your project idea.
                  This may take a minute.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Results */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="size-5" />
          Agent Analysis Results
        </h2>
        <Separator />
        <div className="grid gap-4 md:grid-cols-2">
          {currentAgentResults.map((result) => (
            <AgentResultCard key={result.id} result={result} />
          ))}
        </div>
      </div>

      {/* New Analysis Button */}
      {isCompleted && (
        <div className="flex justify-center pt-4">
          <Link href="/ideation">
            <Button>
              <Lightbulb className="size-4" />
              Analyze Another Idea
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
