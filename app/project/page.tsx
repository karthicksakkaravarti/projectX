import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { ProjectsView } from "./projects-view"

export const dynamic = "force-dynamic"

export default function ProjectPage() {
  return (
    <MessagesProvider>
      <LayoutApp>
        <div className="h-full w-full overflow-y-auto">
          <ProjectsView />
        </div>
      </LayoutApp>
    </MessagesProvider>
  )
}
