"use client"

import { IdeationForm, IdeationSessionList } from "@/app/components/ideation"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { IdeationProvider } from "@/lib/ideation-store"
import { useUser } from "@/lib/user-store/provider"

export default function IdeationPage() {
  const { user } = useUser()

  return (
    <IdeationProvider userId={user?.id}>
      <LayoutApp>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Idea Validator</h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Submit your project idea and let our AI agents analyze its potential
                  across multiple dimensions including market research, competition,
                  technical feasibility, uniqueness, and monetization.
                </p>
              </div>
              <IdeationForm />
              <IdeationSessionList />
            </div>
          </div>
        </div>
      </LayoutApp>
    </IdeationProvider>
  )
}
