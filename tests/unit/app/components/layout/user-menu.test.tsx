import { render, screen, fireEvent } from "@testing-library/react"
import { UserMenu } from "@/app/components/layout/user-menu"
import { useUser } from "@/lib/user-store/provider"

// Mock hooks
jest.mock("@/lib/user-store/provider")

// Mock UI components
jest.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children, open, onOpenChange }: any) => (
        <div data-testid="dropdown-menu" data-open={open}>
            <button data-testid="toggle-menu" onClick={() => onOpenChange?.(!open)}>
                Toggle
            </button>
            {children}
        </div>
    ),
    DropdownMenuTrigger: ({ children }: any) => <button data-testid="menu-trigger">{children}</button>,
    DropdownMenuContent: ({ children, onInteractOutside, onCloseAutoFocus }: any) => (
        <div data-testid="menu-content">
            <button 
                data-testid="outside-click" 
                onClick={(e) => onInteractOutside?.(e)}
            >
                Outside
            </button>
            {children}
        </div>
    ),
    DropdownMenuItem: ({ children, className }: any) => <div className={className}>{children}</div>,
    DropdownMenuSeparator: () => <hr data-testid="separator" />,
}))

jest.mock("@/components/ui/avatar", () => ({
    Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
    AvatarImage: ({ src }: any) => <img src={src} alt="avatar" />,
    AvatarFallback: ({ children }: any) => <div data-testid="avatar-fallback">{children}</div>,
}))

jest.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: any) => <div>{children}</div>,
    TooltipTrigger: ({ children }: any) => <div>{children}</div>,
    TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}))

// Mock triggers using aliased paths
jest.mock("@/app/components/layout/settings/settings-trigger", () => ({
    SettingsTrigger: ({ onOpenChange }: any) => (
        <div>
            <button data-testid="settings-trigger" onClick={() => onOpenChange?.(true)}>
                SettingsTrigger
            </button>
            <button data-testid="settings-close" onClick={() => onOpenChange?.(false)}>
                Close Settings
            </button>
        </div>
    ),
}))
jest.mock("@/app/components/layout/feedback/feedback-trigger", () => ({
    FeedbackTrigger: () => <button data-testid="feedback-trigger">FeedbackTrigger</button>,
}))
jest.mock("@/app/components/layout/app-info/app-info-trigger", () => ({
    AppInfoTrigger: () => <button data-testid="app-info-trigger">AppInfoTrigger</button>,
}))

describe("UserMenu", () => {
    const mockUser = {
        display_name: "Test User",
        email: "test@example.com",
        profile_image: "https://example.com/image.png",
    }

    beforeEach(() => {
        jest.clearAllMocks()
        ;(useUser as jest.Mock).mockReturnValue({ user: mockUser })
    })

    describe("rendering", () => {
        it("renders nothing when user is not logged in", () => {
            ;(useUser as jest.Mock).mockReturnValue({ user: null })
            const { container } = render(<UserMenu />)
            expect(container).toBeEmptyDOMElement()
        })

        it("renders the user avatar", () => {
            render(<UserMenu />)
            expect(screen.getByAltText("avatar")).toHaveAttribute("src", mockUser.profile_image)
        })

        it("renders avatar fallback with first character of display name", () => {
            render(<UserMenu />)
            expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("T")
        })

        it("renders user information and triggers in the menu", () => {
            render(<UserMenu />)
            expect(screen.getByText(mockUser.display_name)).toBeInTheDocument()
            expect(screen.getByText(mockUser.email)).toBeInTheDocument()
            expect(screen.getByTestId("settings-trigger")).toBeInTheDocument()
            expect(screen.getByTestId("feedback-trigger")).toBeInTheDocument()
            expect(screen.getByTestId("app-info-trigger")).toBeInTheDocument()
        })

        it("renders tooltip with Profile text", () => {
            render(<UserMenu />)
            expect(screen.getByTestId("tooltip-content")).toHaveTextContent("Profile")
        })

        it("renders separator between user info and menu items", () => {
            render(<UserMenu />)
            expect(screen.getByTestId("separator")).toBeInTheDocument()
        })
    })

    describe("user without profile image", () => {
        it("renders avatar without image when profile_image is null", () => {
            ;(useUser as jest.Mock).mockReturnValue({ 
                user: { ...mockUser, profile_image: null } 
            })
            render(<UserMenu />)
            const img = screen.getByAltText("avatar")
            expect(img).not.toHaveAttribute("src")
        })
    })

    describe("menu interactions", () => {
        it("should toggle menu open state", () => {
            render(<UserMenu />)
            const toggleButton = screen.getByTestId("toggle-menu")
            
            fireEvent.click(toggleButton)
            expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument()
        })

        it("should handle settings open change", () => {
            render(<UserMenu />)
            const settingsTrigger = screen.getByTestId("settings-trigger")
            
            fireEvent.click(settingsTrigger)
            // Settings should open
            expect(settingsTrigger).toBeInTheDocument()
        })

        it("should close menu when settings is closed", () => {
            render(<UserMenu />)
            
            // Open settings
            fireEvent.click(screen.getByTestId("settings-trigger"))
            
            // Close settings
            fireEvent.click(screen.getByTestId("settings-close"))
            
            // Menu should be closed
            expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument()
        })
    })

    describe("edge cases", () => {
        it("handles user with undefined display_name", () => {
            ;(useUser as jest.Mock).mockReturnValue({ 
                user: { ...mockUser, display_name: undefined } 
            })
            render(<UserMenu />)
            expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("")
        })

        it("handles user with empty email", () => {
            ;(useUser as jest.Mock).mockReturnValue({ 
                user: { ...mockUser, email: "" } 
            })
            render(<UserMenu />)
            expect(screen.getByText(mockUser.display_name)).toBeInTheDocument()
        })
    })
})
