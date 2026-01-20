import { render, screen, fireEvent } from "@testing-library/react"
import { HeaderSidebarTrigger } from "@/app/components/layout/header-sidebar-trigger"
import { useSidebar } from "@/components/ui/sidebar"

// Mock hooks
jest.mock("@/components/ui/sidebar", () => ({
    useSidebar: jest.fn(),
}))

// Mock UI components
jest.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: any) => <div>{children}</div>,
    TooltipTrigger: ({ children }: any) => <div>{children}</div>,
    TooltipContent: ({ children }: any) => <div>{children}</div>,
}))

describe("HeaderSidebarTrigger", () => {
    const mockToggleSidebar = jest.fn()

    beforeEach(() => {
        ; (useSidebar as jest.Mock).mockReturnValue({
            toggleSidebar: mockToggleSidebar,
            open: true,
        })
    })

    it("renders the trigger button", () => {
        render(<HeaderSidebarTrigger />)
        expect(screen.getByRole("button", { name: /toggle sidebar/i })).toBeInTheDocument()
    })

    it("calls toggleSidebar when clicked", () => {
        render(<HeaderSidebarTrigger />)
        fireEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }))
        expect(mockToggleSidebar).toHaveBeenCalled()
    })

    it("shows 'Close sidebar' when sidebar is open", () => {
        ; (useSidebar as jest.Mock).mockReturnValue({
            toggleSidebar: mockToggleSidebar,
            open: true,
        })
        render(<HeaderSidebarTrigger />)
        expect(screen.getByText("Close sidebar")).toBeInTheDocument()
    })

    it("shows 'Open sidebar' when sidebar is closed", () => {
        ; (useSidebar as jest.Mock).mockReturnValue({
            toggleSidebar: mockToggleSidebar,
            open: false,
        })
        render(<HeaderSidebarTrigger />)
        expect(screen.getByText("Open sidebar")).toBeInTheDocument()
    })
})
