import { render, screen, fireEvent } from "@testing-library/react"
import { UserMenu } from "@/app/components/layout/user-menu"
import { useUser } from "@/lib/user-store/provider"

// Mock hooks
jest.mock("@/lib/user-store/provider")

// Mock UI components
jest.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children, open }: any) => (<div>{children}</div>),
    DropdownMenuTrigger: ({ children }: any) => <button>{children}</button>,
    DropdownMenuContent: ({ children, open }: any) => <div>{children}</div>,
    DropdownMenuItem: ({ children }: any) => <div>{children}</div>,
    DropdownMenuSeparator: () => <hr />,
}))

jest.mock("@/components/ui/avatar", () => ({
    Avatar: ({ children }: any) => <div>{children}</div>,
    AvatarImage: ({ src }: any) => <img src={src} alt="avatar" />,
    AvatarFallback: ({ children }: any) => <div>{children}</div>,
}))

jest.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: any) => <div>{children}</div>,
    TooltipTrigger: ({ children }: any) => <div>{children}</div>,
    TooltipContent: ({ children }: any) => <div>{children}</div>,
}))

// Mock triggers using aliased paths
jest.mock("@/app/components/layout/settings/settings-trigger", () => ({
    SettingsTrigger: ({ onOpenChange }: any) => (
        <button onClick={() => onOpenChange(true)}>SettingsTrigger</button>
    ),
}))
jest.mock("@/app/components/layout/feedback/feedback-trigger", () => ({
    FeedbackTrigger: () => <button>FeedbackTrigger</button>,
}))
jest.mock("@/app/components/layout/app-info/app-info-trigger", () => ({
    AppInfoTrigger: () => <button>AppInfoTrigger</button>,
}))

describe("UserMenu", () => {
    const mockUser = {
        display_name: "Test User",
        email: "test@example.com",
        profile_image: "https://example.com/image.png",
    }

    beforeEach(() => {
        ; (useUser as jest.Mock).mockReturnValue({ user: mockUser })
    })

    it("renders nothing when user is not logged in", () => {
        ; (useUser as jest.Mock).mockReturnValue({ user: null })
        const { container } = render(<UserMenu />)
        expect(container).toBeEmptyDOMElement()
    })

    it("renders the user avatar", () => {
        render(<UserMenu />)
        expect(screen.getByAltText("avatar")).toHaveAttribute("src", mockUser.profile_image)
        expect(screen.getByText("T")).toBeInTheDocument() // AvatarFallback
    })

    it("renders user information and triggers in the menu", () => {
        render(<UserMenu />)
        expect(screen.getByText(mockUser.display_name)).toBeInTheDocument()
        expect(screen.getByText(mockUser.email)).toBeInTheDocument()
        expect(screen.getByText("SettingsTrigger")).toBeInTheDocument()
        expect(screen.getByText("FeedbackTrigger")).toBeInTheDocument()
        expect(screen.getByText("AppInfoTrigger")).toBeInTheDocument()
    })
})
