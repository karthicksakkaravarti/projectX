"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useIdeation } from "@/lib/ideation-store"
import { Lightbulb, Spinner } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function IdeationForm() {
  const router = useRouter()
  const { startIdeation, isProcessing } = useIdeation()
  const [title, setTitle] = useState("")
  const [idea, setIdea] = useState("")
  const [additionalContext, setAdditionalContext] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !idea.trim()) return

    const sessionId = await startIdeation({
      title: title.trim(),
      idea: idea.trim(),
      additionalContext: additionalContext.trim() || undefined,
    })

    if (sessionId) {
      router.push(`/ideation/${sessionId}`)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="size-5" />
          Validate Your Idea
        </CardTitle>
        <CardDescription>
          Enter your project idea and our AI agents will analyze its potential
          across market research, competition, technical feasibility, uniqueness,
          and monetization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              placeholder="e.g., AI-Powered Recipe Generator"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isProcessing}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idea">Describe Your Idea</Label>
            <Textarea
              id="idea"
              placeholder="Describe your project idea in detail. What problem does it solve? Who is it for? How does it work?"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              disabled={isProcessing}
              required
              className="min-h-32"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              placeholder="Any additional context, target market specifics, or constraints you want the analysis to consider..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              disabled={isProcessing}
              className="min-h-20"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isProcessing || !title.trim() || !idea.trim()}
          >
            {isProcessing ? (
              <>
                <Spinner className="size-4 animate-spin" />
                Analyzing Your Idea...
              </>
            ) : (
              <>
                <Lightbulb className="size-4" />
                Analyze Idea
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
