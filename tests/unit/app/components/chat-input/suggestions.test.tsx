import { render, screen, fireEvent } from "@testing-library/react"
import { Suggestions } from "@/app/components/chat-input/suggestions"

// Mock motion
jest.mock("motion/react", () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        create: (comp: any) => comp,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock components
jest.mock("@/components/prompt-kit/prompt-suggestion", () => ({
    PromptSuggestion: ({ children, onClick }: any) => (
        <button onClick={onClick} data-testid="suggestion">
            {children}
        </button>
    ),
}))

// Mock config
jest.mock("@/lib/config", () => ({
    SUGGESTIONS: [
        {
            label: "Category 1",
            prompt: "Prompt 1",
            icon: ({ className }: any) => <div className={className} data-testid="icon-1" />,
            items: ["Item 1a", "Item 1b"],
            highlight: true,
        },
        {
            label: "Category 2",
            prompt: "Prompt 2",
            icon: ({ className }: any) => <div className={className} data-testid="icon-2" />,
            items: ["Item 2a"],
        },
    ],
}))

describe("Suggestions", () => {
    const mockOnValueChange = jest.fn()
    const mockOnSuggestion = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("renders suggestions grid initially", () => {
        render(
            <Suggestions
                onValueChange={mockOnValueChange}
                onSuggestion={mockOnSuggestion}
                value=""
            />
        )
        expect(screen.getByText("Category 1")).toBeInTheDocument()
        expect(screen.getByText("Category 2")).toBeInTheDocument()
    })

    it("switches to items list when a category is clicked", () => {
        render(
            <Suggestions
                onValueChange={mockOnValueChange}
                onSuggestion={mockOnSuggestion}
                value=""
            />
        )

        fireEvent.click(screen.getByText("Category 1"))

        expect(mockOnValueChange).toHaveBeenCalledWith("Prompt 1")
        expect(screen.getByText("Item 1a")).toBeInTheDocument()
        expect(screen.getByText("Item 1b")).toBeInTheDocument()
    })

    it("calls onSuggestion and resets when an item is clicked", () => {
        render(
            <Suggestions
                onValueChange={mockOnValueChange}
                onSuggestion={mockOnSuggestion}
                value="Prompt 1"
            />
        )

        // Trigger category switch
        fireEvent.click(screen.getByText("Category 1"))

        fireEvent.click(screen.getByText("Item 1a"))

        expect(mockOnSuggestion).toHaveBeenCalledWith("Item 1a")
        expect(mockOnValueChange).toHaveBeenCalledWith("")
    })
})
