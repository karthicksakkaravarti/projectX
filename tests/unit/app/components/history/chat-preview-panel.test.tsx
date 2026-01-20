import { render, screen, fireEvent } from "@testing-library/react"
import { ChatPreviewPanel } from "@/app/components/history/chat-preview-panel"

jest.mock("@/components/prompt-kit/message", () => ({
    MessageContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe("ChatPreviewPanel", () => {
    const mockOnFetchPreview = jest.fn()
    const mockMessages = [
        { id: "1", content: "Hello", role: "user" as const, created_at: new Date().toISOString() },
        { id: "2", content: "Hi there!", role: "assistant" as const, created_at: new Date().toISOString() },
    ]

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("should render default state when no chatId is provided", () => {
        render(<ChatPreviewPanel chatId={null} />)
        expect(screen.getByText("Select a conversation to preview")).toBeInTheDocument()
    })

    it("should render loading state", () => {
        render(<ChatPreviewPanel chatId="123" isLoading={true} />)
        expect(screen.getByText("Loading messages...")).toBeInTheDocument()
    })

    it("should render error state", () => {
        render(
            <ChatPreviewPanel
                chatId="123"
                error="Failed to fetch messages"
                onFetchPreview={mockOnFetchPreview}
            />
        )
        expect(screen.getByText("Failed to load preview")).toBeInTheDocument()
    })

    it("should call onRetry when 'Try again' is clicked for network errors", () => {
        render(
            <ChatPreviewPanel
                chatId="123"
                error="Failed to fetch"
                onFetchPreview={mockOnFetchPreview}
            />
        )
        const retryButton = screen.getByText("Try again")
        fireEvent.click(retryButton)
        expect(mockOnFetchPreview).toHaveBeenCalledWith("123")
    })

    it("should render empty state when no messages are found", () => {
        render(<ChatPreviewPanel chatId="123" messages={[]} />)
        expect(screen.getByText("No messages in this conversation yet")).toBeInTheDocument()
    })

    it("should render messages correctly", () => {
        render(<ChatPreviewPanel chatId="123" messages={mockMessages} />)
        expect(screen.getByText("Hello")).toBeInTheDocument()
        expect(screen.getByText("Hi there!")).toBeInTheDocument()
        expect(screen.getByText(`Last ${mockMessages.length} messages`)).toBeInTheDocument()
    })

    it("should call onFetchPreview when chatId changes", () => {
        const { rerender } = render(
            <ChatPreviewPanel chatId="1" onFetchPreview={mockOnFetchPreview} />
        )
        expect(mockOnFetchPreview).toHaveBeenCalledWith("1")

        rerender(<ChatPreviewPanel chatId="2" onFetchPreview={mockOnFetchPreview} />)
        expect(mockOnFetchPreview).toHaveBeenCalledWith("2")
    })
})
