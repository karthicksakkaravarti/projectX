"use client";

import { PlugsConnected } from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { fetchClient } from "@/lib/fetch";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Loader2, Pencil, PlusIcon, RefreshCw, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Transport = "http" | "sse";

type McpServer = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  hasToken: boolean;
  transport: Transport;
  createdAt: string;
};

function getHostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function McpServersSection() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<McpServer | null>(null);
  const [form, setForm] = useState<{
    name: string;
    url: string;
    apiToken: string;
    transport: Transport;
  }>({
    name: "",
    url: "",
    apiToken: "",
    transport: "http",
  });
  const { data, isLoading } = useQuery({
    queryKey: ["mcp-servers"],
    queryFn: async () => {
      const res = await fetchClient("/api/mcp-servers");
      if (!res.ok) throw new Error("Failed to load MCP servers");
      return res.json() as Promise<{ servers: McpServer[] }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      id?: string;
      name: string;
      url: string;
      apiToken?: string;
      enabled?: boolean;
      transport?: Transport;
    }) => {
      const method = payload.id ? "PUT" : "POST";
      const path = payload.id ? `/api/mcp-servers/${payload.id}` : "/api/mcp-servers";
      const res = await fetchClient(path, {
        method,
        body: JSON.stringify({
          name: payload.name,
          url: payload.url,
          apiToken: payload.apiToken || undefined,
          enabled: payload.enabled ?? true,
          transport: payload.transport,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast({
        title: vars.id ? "Server updated" : "Server added",
        description: `${vars.name} has been ${vars.id ? "updated" : "added"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["mcp-servers"] });
      if (vars.id) {
        queryClient.invalidateQueries({
          queryKey: ["mcp-server-tools", vars.id],
        });
      }
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save server",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchClient(`/api/mcp-servers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      return res.json();
    },
    onSuccess: (_, id) => {
      toast({ title: "Server deleted" });
      queryClient.invalidateQueries({ queryKey: ["mcp-servers"] });
      setDeleteDialogOpen(false);
      setServerToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete server",
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm({ name: "", url: "", apiToken: "", transport: "http" });
  };

  const startEdit = (server: McpServer) => {
    setEditingId(server.id);
    setForm({
      name: server.name,
      url: server.url,
      apiToken: "",
      transport: server.transport ?? "http",
    });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!form.name || !form.url) return;
    saveMutation.mutate({
      id: editingId || undefined,
      name: form.name,
      url: form.url,
      apiToken: form.apiToken || undefined,
      transport: form.transport,
    });
  };

  const handleDelete = () => {
    if (serverToDelete) {
      deleteMutation.mutate(serverToDelete.id);
    }
  };

  const servers = data?.servers ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">MCP Servers</h3>
          <p className="text-muted-foreground text-sm">
            Connect to Model Context Protocol servers to add tools to your agent.
          </p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <PlusIcon className="mr-1 size-4" />
            Add server
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      )}

      {!isLoading && servers.length === 0 && !isAdding && (
        <div className="py-8 text-center">
          <PlugsConnected className="text-muted-foreground mx-auto mb-2 size-12" />
          <h3 className="mb-1 text-sm font-medium">No MCP servers configured</h3>
          <p className="text-muted-foreground text-sm">
            Add an MCP server to enable tools for your agent.
          </p>
        </div>
      )}

      {!isLoading && servers.length > 0 && (
        <div className="mt-4 space-y-3">
          {servers.map((server) => (
            <div
              key={server.id}
              className={cn(
                "rounded-lg border transition-opacity",
                !server.enabled && "opacity-50"
              )}
            >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md text-xs font-bold"
                  style={{ width: 28, height: 28 }}
                >
                  {server.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{server.name}</div>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <span>{getHostFromUrl(server.url)}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 uppercase">
                      {server.transport ?? "http"}
                    </span>
                    {server.hasToken && (
                      <span className="rounded bg-secondary px-1.5 py-0.5">
                        Auth
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={server.enabled}
                  onCheckedChange={(enabled) => {
                    saveMutation.mutate({
                      id: server.id,
                      name: server.name,
                      url: server.url,
                      enabled,
                      transport: server.transport,
                    });
                  }}
                  disabled={saveMutation.isPending}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEdit(server)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setServerToDelete(server);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
            {server.enabled && <ServerTools serverId={server.id} />}
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="mt-4 rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-medium">
              {editingId ? "Edit server" : "Add MCP server"}
            </h4>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="size-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="mcp-name">Name</Label>
              <Input
                id="mcp-name"
                placeholder="My MCP Server"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="mcp-url">Server URL</Label>
              <Input
                id="mcp-url"
                placeholder="http://localhost:3001/mcp/projectx"
                value={form.url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, url: e.target.value }))
                }
                className="mt-1"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Path format: <code className="font-mono">/mcp/&lt;module&gt;</code> for
                Streamable HTTP, <code className="font-mono">/sse/&lt;module&gt;</code>{" "}
                for SSE.
              </p>
            </div>

            <div>
              <Label htmlFor="mcp-transport">Transport</Label>
              <Select
                value={form.transport}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, transport: value as Transport }))
                }
              >
                <SelectTrigger id="mcp-transport" className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">Streamable HTTP</SelectItem>
                  <SelectItem value="sse">SSE</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground mt-1 text-xs">
                Use Streamable HTTP for modern MCP servers; SSE for legacy
                servers that only expose an event-stream endpoint.
              </p>
            </div>

            <div>
              <Label htmlFor="mcp-token">
                API Key{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="mcp-token"
                type="password"
                placeholder="Bearer token for authentication"
                value={form.apiToken}
                onChange={(e) =>
                  setForm((f) => ({ ...f, apiToken: e.target.value }))
                }
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!form.name || !form.url || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : null}
                {editingId ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete MCP server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{serverToDelete?.name}</strong>? This will remove all
              tools from this server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type ToolsResult =
  | { ok: true; tools: { name: string; description: string }[] }
  | { ok: false; error: string };

function ServerTools({ serverId }: { serverId: string }) {
  const [open, setOpen] = useState(false);

  const { data, isFetching, refetch } = useQuery<ToolsResult>({
    queryKey: ["mcp-server-tools", serverId],
    queryFn: async () => {
      const res = await fetchClient(`/api/mcp-servers/${serverId}/tools`);
      if (!res.ok) {
        const err = await res.json();
        return { ok: false, error: err.error || "Failed to load tools" };
      }
      return res.json();
    },
    enabled: open,
    staleTime: 30_000,
  });

  return (
    <div className="border-t">
      <button
        type="button"
        className="hover:bg-muted/50 flex w-full items-center justify-between px-4 py-2 text-left text-sm"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
          <span className="font-medium">Tools</span>
          {data?.ok && (
            <span className="text-muted-foreground">{data.tools.length}</span>
          )}
        </span>
        {open && (
          <span
            className="hover:text-foreground text-muted-foreground inline-flex items-center gap-1"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              refetch();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                refetch();
              }
            }}
          >
            <RefreshCw
              className={cn("size-3.5", isFetching && "animate-spin")}
            />
            Refresh
          </span>
        )}
      </button>

      {open && (
        <div className="px-4 pb-3">
          {isFetching && !data && (
            <div className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Connecting…
            </div>
          )}
          {data?.ok === false && (
            <p className="bg-destructive/10 text-destructive rounded-md p-2 text-xs break-words whitespace-pre-wrap">
              {data.error}
            </p>
          )}
          {data?.ok && data.tools.length === 0 && (
            <p className="text-muted-foreground py-2 text-sm">
              This server didn&apos;t expose any tools.
            </p>
          )}
          {data?.ok && data.tools.length > 0 && (
            <ul className="divide-border divide-y">
              {data.tools.map((tool) => (
                <li key={tool.name} className="py-2">
                  <div className="font-mono text-xs font-medium">
                    {tool.name}
                  </div>
                  {tool.description && (
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      {tool.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
