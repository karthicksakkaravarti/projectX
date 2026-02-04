"use client"

import { toast } from "@/components/ui/toast"
import { createContext, useContext, useState, useCallback } from "react"
import type { IdeationSession, IdeationAgentResult, IdeationInput } from "./types"
import {
  getUserIdeationSessions,
  getIdeationSession,
  getAgentResults,
  deleteIdeationSession as deleteSessionFromDb,
} from "./api"

interface IdeationContextType {
  sessions: IdeationSession[]
  currentSession: IdeationSession | null
  currentAgentResults: IdeationAgentResult[]
  isLoading: boolean
  isProcessing: boolean
  error: string | null
  fetchSessions: () => Promise<void>
  fetchSession: (sessionId: string) => Promise<void>
  startIdeation: (input: IdeationInput) => Promise<string | null>
  deleteSession: (sessionId: string) => Promise<void>
  clearCurrentSession: () => void
  refreshCurrentSession: () => Promise<void>
}

const IdeationContext = createContext<IdeationContextType | null>(null)

export function useIdeation() {
  const context = useContext(IdeationContext)
  if (!context) {
    throw new Error("useIdeation must be used within IdeationProvider")
  }
  return context
}

export function IdeationProvider({
  userId,
  children,
}: {
  userId?: string
  children: React.ReactNode
}) {
  const [sessions, setSessions] = useState<IdeationSession[]>([])
  const [currentSession, setCurrentSession] = useState<IdeationSession | null>(null)
  const [currentAgentResults, setCurrentAgentResults] = useState<IdeationAgentResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getUserIdeationSessions(userId)
      setSessions(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch sessions"
      setError(message)
      toast({ title: message, status: "error" })
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const fetchSession = useCallback(async (sessionId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const [session, results] = await Promise.all([
        getIdeationSession(sessionId),
        getAgentResults(sessionId),
      ])
      setCurrentSession(session)
      setCurrentAgentResults(results)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch session"
      setError(message)
      toast({ title: message, status: "error" })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshCurrentSession = useCallback(async () => {
    if (!currentSession) return
    try {
      const [session, results] = await Promise.all([
        getIdeationSession(currentSession.id),
        getAgentResults(currentSession.id),
      ])
      setCurrentSession(session)
      setCurrentAgentResults(results)
    } catch (err) {
      console.error("Failed to refresh session:", err)
    }
  }, [currentSession])

  const startIdeation = useCallback(async (input: IdeationInput): Promise<string | null> => {
    if (!userId) {
      toast({ title: "Please sign in to use ideation", status: "error" })
      return null
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/ideation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, input }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to start ideation")
      }

      const { sessionId } = await response.json()

      // Fetch the session and results
      await fetchSession(sessionId)
      await fetchSessions()

      return sessionId
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start ideation"
      setError(message)
      toast({ title: message, status: "error" })
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [userId, fetchSession, fetchSessions])

  const deleteSession = useCallback(async (sessionId: string) => {
    const prev = [...sessions]
    setSessions((s) => s.filter((session) => session.id !== sessionId))

    try {
      await deleteSessionFromDb(sessionId)
      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
        setCurrentAgentResults([])
      }
      toast({ title: "Session deleted", status: "success" })
    } catch (err) {
      setSessions(prev)
      const message = err instanceof Error ? err.message : "Failed to delete session"
      toast({ title: message, status: "error" })
    }
  }, [sessions, currentSession])

  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null)
    setCurrentAgentResults([])
    setError(null)
  }, [])

  return (
    <IdeationContext.Provider
      value={{
        sessions,
        currentSession,
        currentAgentResults,
        isLoading,
        isProcessing,
        error,
        fetchSessions,
        fetchSession,
        startIdeation,
        deleteSession,
        clearCurrentSession,
        refreshCurrentSession,
      }}
    >
      {children}
    </IdeationContext.Provider>
  )
}
