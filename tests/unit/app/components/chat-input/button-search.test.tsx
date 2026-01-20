import { render, screen, fireEvent } from "@testing-library/react"
import { ButtonSearch } from "@/app/components/chat-input/button-search"

// Mock UI components
jest.mock("@/components/ui/button", () => ({
    Button: ({ children, className, onClick }: any) => (
        <button className={className} onClick={onClick}>
            {children}
        </button>
    ),
}))

jest.mock("@/components/ui/popover", () => ({
    Popover: ({ children }: any) => <div>{children}</div>,
    PopoverTrigger: ({ children }: any) => <div>{children}</div>,
    PopoverContent: ({ children }: any) => <div>{children}</div>,
}))

jest.mock("@/app/components/chat-input/popover-content-auth", () => ({
    PopoverContentAuth: () => <div data-testid="popover-auth">Auth Content</div>,
}))

describe("ButtonSearch", () => {
    const defaultProps = {
        isAuthenticated: true,
        isSelected: false,
        onToggle: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("renders search button when authenticated", () => {
        render(<ButtonSearch {...defaultProps} />)
        expect(screen.getByText("Search")).toBeInTheDocument()
        expect(screen.queryByTestId("popover-auth")).not.toBeInTheDocument()
    })

    it("toggles state when clicked", () => {
        render(<ButtonSearch {...defaultProps} />)
        fireEvent.click(screen.getByText("Search"))
        expect(defaultProps.onToggle).toHaveBeenCalledWith(true)
    })

    it("shows active state styles when selected", () => {
        render(<ButtonSearch {...defaultProps} isSelected={true} />)
        const button = screen.getByText("Search").closest("button")
        expect(button).toHaveClass("border-[#0091FF]/20")
        expect(button).toHaveClass("text-[#0091FF]")
    })

    it("renders auth popover when not authenticated", () => {
        render(<ButtonSearch {...defaultProps} isAuthenticated={false} />)
        expect(screen.getByText("Search")).toBeInTheDocument()
        expect(screen.getByTestId("popover-auth")).toBeInTheDocument()
    })
})
