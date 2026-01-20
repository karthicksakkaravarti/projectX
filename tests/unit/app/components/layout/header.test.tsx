import { render, screen } from "@testing-library/react"
import { Header } from "@/app/components/layout/header"
import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { useUser } from "@/lib/user-store/provider"
import { useUserPreferences } from "@/lib/user-preference-store/provider"

// Mock hooks
jest.mock("@/app/hooks/use-breakpoint")
jest.mock("@/lib/user-store/provider")
jest.mock("@/lib/user-preference-store/provider")

// Mock child components
jest.mock("@/app/components/history/history-trigger", () => ({
    HistoryTrigger: () => <div>HistoryTrigger</div>,
}))
jest.mock("@/app/components/layout/app-info/app-info-trigger", () => ({
    AppInfoTrigger: ({ trigger }: any) => <div>AppInfoTrigger {trigger}</div>,
}))
jest.mock("@/app/components/layout/button-new-chat", () => ({
    ButtonNewChat: () => <div>ButtonNewChat</div>,
}))
jest.mock("@/app/components/layout/user-menu", () => ({
    UserMenu: () => <div>UserMenu</div>,
}))
jest.mock("@/app/components/layout/dialog-publish", () => ({
    DialogPublish: () => <div>DialogPublish</div>,
}))
jest.mock("@/app/components/layout/header-sidebar-trigger", () => ({
    HeaderSidebarTrigger: () => <div>HeaderSidebarTrigger</div>,
}))
jest.mock("@/components/icons/projectx", () => ({
    ProjectXIcon: () => <div>ProjectXIcon</div>,
}))

jest.mock("@/lib/config", () => ({
    APP_NAME: "ProjectX",
}))

describe("Header", () => {
    beforeEach(() => {
        ; (useBreakpoint as jest.Mock).mockReturnValue(false)
            ; (useUser as jest.Mock).mockReturnValue({ user: null })
            ; (useUserPreferences as jest.Mock).mockReturnValue({
                preferences: { multiModelEnabled: false },
            })
    })

    it("renders the app logo and name", () => {
        render(<Header hasSidebar={false} />)
        expect(screen.getByText("ProjectX")).toBeInTheDocument()
        expect(screen.getByText("ProjectXIcon")).toBeInTheDocument()
    })

    it("renders login link when user is not logged in", () => {
        render(<Header hasSidebar={false} />)
        expect(screen.getByText("Login")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /about projectx/i })).toBeInTheDocument()
    })

    it("renders user menu and chat buttons when user is logged in", () => {
        ; (useUser as jest.Mock).mockReturnValue({ user: { id: "1" } })
        render(<Header hasSidebar={false} />)

        expect(screen.queryByText("Login")).not.toBeInTheDocument()
        expect(screen.getByText("UserMenu")).toBeInTheDocument()
        expect(screen.getByText("ButtonNewChat")).toBeInTheDocument()
        expect(screen.getByText("DialogPublish")).toBeInTheDocument()
    })

    it("renders HeaderSidebarTrigger on mobile when hasSidebar is true", () => {
        ; (useBreakpoint as jest.Mock).mockReturnValue(true)
        render(<Header hasSidebar={true} />)
        expect(screen.getByText("HeaderSidebarTrigger")).toBeInTheDocument()
    })

    it("renders HistoryTrigger when hasSidebar is false", () => {
        ; (useUser as jest.Mock).mockReturnValue({ user: { id: "1" } })
        render(<Header hasSidebar={false} />)
        expect(screen.getByText("HistoryTrigger")).toBeInTheDocument()
    })

    it("does not render DialogPublish when multiModelEnabled is true", () => {
        ; (useUser as jest.Mock).mockReturnValue({ user: { id: "1" } })
            ; (useUserPreferences as jest.Mock).mockReturnValue({
                preferences: { multiModelEnabled: true },
            })
        render(<Header hasSidebar={false} />)
        expect(screen.queryByText("DialogPublish")).not.toBeInTheDocument()
    })
})
