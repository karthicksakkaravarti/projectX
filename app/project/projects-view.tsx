"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DialogCreateProject } from "@/app/components/layout/sidebar/dialog-create-project"
import { MagnifyingGlass, CalendarBlank, Clock, SortAscending, SortDescending, FolderPlus } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useMemo, useState } from "react"

function formatDistanceToNow(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return "just now"
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays}d ago`
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return `${diffInMonths}mo ago`
  
  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}y ago`
}

type Project = {
  id: string
  name: string
  user_id: string
  created_at: string
}

export function ProjectsView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects")
      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }
      return response.json()
    },
  })

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(project => 
        project.name.toLowerCase().includes(query)
      )
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name)
      }
      return 0
    })

    return result
  }, [projects, searchQuery, sortBy])

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view all your projects in one place.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <FolderPlus className="mr-2" size={18} />
          New Project
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlass 
            className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" 
            size={18} 
          />
          <Input 
            type="text"
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex w-full sm:w-auto">
          <Select 
            value={sortBy} 
            onValueChange={(val: "newest" | "oldest" | "name-asc" | "name-desc") => setSortBy(val)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>Newest first</span>
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center gap-2">
                  <CalendarBlank size={16} />
                  <span>Oldest first</span>
                </div>
              </SelectItem>
              <SelectItem value="name-asc">
                <div className="flex items-center gap-2">
                  <SortAscending size={16} />
                  <span>Name (A-Z)</span>
                </div>
              </SelectItem>
              <SelectItem value="name-desc">
                <div className="flex items-center gap-2">
                  <SortDescending size={16} />
                  <span>Name (Z-A)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted/50 rounded-t-xl" />
            </Card>
          ))}
        </div>
      ) : filteredAndSortedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full mb-4">
            <MagnifyingGlass size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No projects found</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {searchQuery 
              ? "We couldn't find any projects matching your search." 
              : "You haven't created any projects yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedProjects.map((project) => (
            <Link key={project.id} href={`/p/${project.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="truncate">{project.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-1.5">
                    <Clock size={14} />
                    {project.created_at 
                      ? formatDistanceToNow(project.created_at)
                      : "Unknown date"}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
      
      <DialogCreateProject isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} />
    </div>
  )
}
