"use client"

import { IdeationResults } from "@/app/components/ideation"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { IdeationProvider, useIdeation } from "@/lib/ideation-store"
import { useUser } from "@/lib/user-store/provider"
import { useParams } from "next/navigation"
import { useEffect } from "react"

function IdeationSessionContent() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const { fetchSession } = useIdeation()

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId)
    }
  }, [sessionId, fetchSession])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <IdeationResults />
        </div>
      </div>
    </div>
  )
}

export default function IdeationSessionPage() {
  const { user } = useUser()

  return (
    <IdeationProvider userId={user?.id}>
      <LayoutApp>
        <IdeationSessionContent />
      </LayoutApp>
    </IdeationProvider>
  )
}
