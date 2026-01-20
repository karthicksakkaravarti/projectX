import { render, screen } from "@testing-library/react"
import { AppInfoTrigger } from "@/app/components/layout/app-info/app-info-trigger"
import { useBreakpoint } from "@/app/hooks/use-breakpoint"

// Mock hooks
jest.mock("@/app/hooks/use-breakpoint")

// Mock child components
jest.mock("@/app/components/layout/app-info/app-info-content", () => ({
    AppInfoContent: () => <div>AppInfoContent</div>,
}))

// Mock UI components
jest.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children }: any) => <div>{children}</div>,
    DialogTrigger: ({ children }: any) => <div>{children}</div>,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
}))

jest.mock("@/components/ui/drawer", () => ({
    Drawer: ({ children }: any) => <div>{children}</div>,
    DrawerTrigger: ({ children }: any) => <div>{children}</div>,
    DrawerContent: ({ children }: any) => <div>{children}</div>,
    DrawerHeader: ({ children }: any) => <div>{children}</div>,
    DrawerTitle: ({ children }: any) => <div>{children}</div>,
    DrawerDescription: ({ children }: any) => <div>{children}</div>,
}))

jest.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenuItem: ({ children }: any) => <div>{children}</div>,
}))

jest.mock("@/lib/config", () => ({
    APP_NAME: "ProjectX",
}))

describe("AppInfoTrigger", () => {
    beforeEach(() => {
        ; (useBreakpoint as jest.Mock).mockReturnValue(false)
    })

    it("renders with default trigger when no trigger prop is provided", () => {
        render(<AppInfoTrigger />)
        expect(screen.getByText(/About ProjectX/i)).toBeInTheDocument()
    })

    it("renders with custom trigger when trigger prop is provided", () => {
        render(<AppInfoTrigger trigger={<button>Custom Trigger</button>} />)
        expect(screen.getByText("Custom Trigger")).toBeInTheDocument()
        expect(screen.queryByText(/About ProjectX/i)).not.toBeInTheDocument()
    })

    it("renders AppInfoContent in dialog on desktop", () => {
        ; (useBreakpoint as jest.Mock).mockReturnValue(false)
        render(<AppInfoTrigger />)
        expect(screen.getByText("AppInfoContent")).toBeInTheDocument()
    })

    it("renders AppInfoContent in drawer on mobile", () => {
        ; (useBreakpoint as jest.Mock).mockReturnValue(true)
        render(<AppInfoTrigger />)
        expect(screen.getByText("AppInfoContent")).toBeInTheDocument()
    })
})
