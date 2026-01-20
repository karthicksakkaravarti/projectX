
import { fireEvent, render, screen, createEvent } from "@testing-library/react"
import { SettingsTrigger } from "@/app/components/layout/settings/settings-trigger"

// Mock internal dependencies
jest.mock("@/app/components/layout/settings/settings-content", () => ({
    SettingsContent: ({ isDrawer }: { isDrawer: boolean }) => (
        <div data-testid="settings-content">
            SettingsContent {isDrawer ? "(Drawer)" : "(Dialog)"}
        </div>
    ),
}))

// Mock UI components
jest.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children, open, onOpenChange }: any) => (
        <div data-testid="dialog" data-open={open} onClick={() => onOpenChange && onOpenChange(false)}>
            {children}
        </div>
    ),
    DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
    DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
    DialogTrigger: ({ children, asChild }: any) => {
        const child = asChild ? children : <button>{children}</button>
        return (
            <div data-testid="dialog-trigger" onClick={() => { }}>
                {child}
            </div>
        )
    },
}))

jest.mock("@/components/ui/drawer", () => ({
    Drawer: ({ children, open, onOpenChange }: any) => (
        <div data-testid="drawer" data-open={open} onClick={() => onOpenChange && onOpenChange(false)}>
            {children}
        </div>
    ),
    DrawerContent: ({ children }: any) => <div data-testid="drawer-content">{children}</div>,
    DrawerTrigger: ({ children }: any) => <div data-testid="drawer-trigger">{children}</div>,
}))

jest.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenuItem: ({ children, onSelect }: any) => (
        <button
            data-testid="dropdown-menu-item"
            onClick={(e) => {
                if (onSelect) onSelect(e)
            }}
        >
            {children}
        </button>
    ),
}))

// Mock useBreakpoint hook
const mockUseBreakpoint = jest.fn()
jest.mock("@/app/hooks/use-breakpoint", () => ({
    useBreakpoint: (width: number) => mockUseBreakpoint(width),
}))

describe("SettingsTrigger", () => {
    const mockOnOpenChange = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        mockOnOpenChange.mockReset()
    })

    it("renders as a Dialog on desktop (breakpoint false)", () => {
        mockUseBreakpoint.mockReturnValue(false)

        render(<SettingsTrigger onOpenChange={mockOnOpenChange} />)

        expect(screen.getByTestId("dialog")).toBeInTheDocument()
        expect(screen.queryByTestId("drawer")).not.toBeInTheDocument()
    })

    it("renders as a Drawer on mobile (breakpoint true)", () => {
        mockUseBreakpoint.mockReturnValue(true)

        render(<SettingsTrigger onOpenChange={mockOnOpenChange} />)

        expect(screen.getByTestId("drawer")).toBeInTheDocument()
        expect(screen.queryByTestId("dialog")).not.toBeInTheDocument()
    })

    it("renders the trigger button correctly", () => {
        mockUseBreakpoint.mockReturnValue(false)
        render(<SettingsTrigger onOpenChange={mockOnOpenChange} />)

        const triggerBtn = screen.getByTestId("dropdown-menu-item")
        expect(triggerBtn).toHaveTextContent("Settings")
    })

    it("prevents default on dropdown item select", () => {
        mockUseBreakpoint.mockReturnValue(false)
        render(<SettingsTrigger onOpenChange={mockOnOpenChange} />)

        const triggerBtn = screen.getByTestId("dropdown-menu-item")
        const preventDefault = jest.fn()

        // Create the event properly
        const event = createEvent.click(triggerBtn)
        event.preventDefault = preventDefault

        fireEvent(triggerBtn, event)

        expect(preventDefault).toHaveBeenCalled()
    })

    it("handles open change updates", () => {
        mockUseBreakpoint.mockReturnValue(false)
        render(<SettingsTrigger onOpenChange={mockOnOpenChange} />)

        const dialog = screen.getByTestId("dialog")
        // Trigger the mock's onClick which calls onOpenChange(false)
        fireEvent.click(dialog)

        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it("passes isDrawer prop to SettingsContent when in mobile mode", () => {
        mockUseBreakpoint.mockReturnValue(true)
        render(<SettingsTrigger onOpenChange={mockOnOpenChange} />)

        expect(screen.getByText("SettingsContent (Drawer)")).toBeInTheDocument()
    })

    it("does not pass isDrawer prop (or passes false) to SettingsContent when in desktop mode", () => {
        mockUseBreakpoint.mockReturnValue(false)
        render(<SettingsTrigger onOpenChange={mockOnOpenChange} />)

        expect(screen.getByText("SettingsContent (Dialog)")).toBeInTheDocument()
    })
})
