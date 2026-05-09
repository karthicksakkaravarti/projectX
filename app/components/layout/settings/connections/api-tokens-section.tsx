"use client"

import { KeyIcon } from "@phosphor-icons/react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { fetchClient } from "@/lib/fetch"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Copy, Loader2, PlusIcon, Trash2 } from "lucide-react"
import { useState } from "react"

type ApiToken = {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  createdAt: string
}

type GeneratedToken = {
  id: string
  name: string
  prefix: string
  createdAt: string
  plaintext: string
}

function formatDate(value: string | null): string {
  if (!value) return "Never"
  return new Date(value).toLocaleString()
}

export function ApiTokensSection() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [generated, setGenerated] = useState<GeneratedToken | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tokenToDelete, setTokenToDelete] = useState<ApiToken | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["user-tokens"],
    queryFn: async () => {
      const res = await fetchClient("/api/user-tokens")
      if (!res.ok) throw new Error("Failed to load tokens")
      return res.json() as Promise<{ tokens: ApiToken[] }>
    },
  })

  const createMutation = useMutation({
    mutationFn: async (tokenName: string) => {
      const res = await fetchClient("/api/user-tokens", {
        method: "POST",
        body: JSON.stringify({ name: tokenName }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create token")
      }
      return res.json() as Promise<{ token: GeneratedToken }>
    },
    onSuccess: (result) => {
      setGenerated(result.token)
      setName("")
      setCreateOpen(false)
      queryClient.invalidateQueries({ queryKey: ["user-tokens"] })
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create token",
        description: error.message,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchClient(`/api/user-tokens/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete token")
      }
      return res.json()
    },
    onSuccess: () => {
      toast({ title: "Token revoked" })
      queryClient.invalidateQueries({ queryKey: ["user-tokens"] })
      setDeleteDialogOpen(false)
      setTokenToDelete(null)
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to revoke token",
        description: error.message,
      })
    },
  })

  const handleCopy = async () => {
    if (!generated) return
    await navigator.clipboard.writeText(generated.plaintext)
    toast({ title: "Copied to clipboard" })
  }

  const tokens = data?.tokens ?? []

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">API Tokens</h3>
          <p className="text-muted-foreground text-sm">
            Generate personal access tokens to authenticate MCP servers and
            other integrations on your behalf.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <PlusIcon className="mr-1 size-4" />
          Generate token
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      )}

      {!isLoading && tokens.length === 0 && (
        <div className="py-8 text-center">
          <KeyIcon className="text-muted-foreground mx-auto mb-2 size-12" />
          <h3 className="mb-1 text-sm font-medium">No tokens yet</h3>
          <p className="text-muted-foreground text-sm">
            Generate a token to use when registering MCP servers.
          </p>
        </div>
      )}

      {!isLoading && tokens.length > 0 && (
        <div className="mt-4 space-y-3">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <div className="font-medium">{token.name}</div>
                <div className="text-muted-foreground text-xs">
                  <code className="font-mono">{token.prefix}…</code>
                  <span className="mx-2">·</span>
                  <span>Last used {formatDate(token.lastUsedAt)}</span>
                  <span className="mx-2">·</span>
                  <span>Created {formatDate(token.createdAt)}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setTokenToDelete(token)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API token</DialogTitle>
            <DialogDescription>
              Give your token a name so you can identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="token-name">Name</Label>
            <Input
              id="token-name"
              placeholder="MCP server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false)
                setName("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(name.trim())}
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-1 size-4 animate-spin" />
              )}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!generated}
        onOpenChange={(open) => {
          if (!open) setGenerated(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your token</DialogTitle>
            <DialogDescription>
              This token will only be shown once. Copy it now and store it
              somewhere safe.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted flex items-center gap-2 rounded-md p-3">
            <code className="flex-1 break-all font-mono text-sm">
              {generated?.plaintext}
            </code>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              <Copy className="size-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setGenerated(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API token</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke{" "}
              <strong>{tokenToDelete?.name}</strong>? Any MCP server or
              integration using this token will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (tokenToDelete) deleteMutation.mutate(tokenToDelete.id)
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
