"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useIdeation } from "@/lib/ideation-store"
import type { IdeationSession } from "@/lib/ideation-store/types"
import {
  Clock,
  Lightbulb,
  Spinner,
  Trash,
  ArrowRight,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useEffect } from "react"

function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground"
  if (score >= 8) return "text-green-500"
  if (score >= 6) return "text-yellow-500"
  if (score >= 4) return "text-orange-500"
  return "text-red-500"
}

function SessionCard({
  session,
  onDelete,
}: {
  session: IdeationSession
  onDelete: (id: string) => void
}) {
  const isProcessing = session.status === "processing"
  const isCompleted = session.status === "completed"

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate flex items-center gap-2">
              <Lightbulb className="size-4 shrink-0" />
              {session.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs mt-1">
              <Clock className="size-3" />
              {new Date(session.created_at || "").toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isCompleted && session.overall_score !== null && (
              <span className={cn("text-lg font-bold", getScoreColor(session.overall_score))}>
                {session.overall_score}/10
              </span>
            )}
            <Badge
              variant={isProcessing ? "secondary" : isCompleted ? "default" : "destructive"}
              className="text-xs"
            >
              {isProcessing && <Spinner className="size-3 animate-spin mr-1" />}
              {session.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {session.idea}
        </p>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(session.id)
            }}
          >
            <Trash className="size-4" />
          </Button>
          <Link href={`/ideation/${session.id}`}>
            <Button variant="ghost" size="sm">
              View Details
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export function IdeationSessionList() {
  const { sessions, fetchSessions, isLoading, deleteSession } = useIdeation()

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mt-8">
      <Separator />
      <h2 className="text-lg font-semibold">Previous Ideation Sessions</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onDelete={deleteSession}
          />
        ))}
      </div>
    </div>
  )
}
