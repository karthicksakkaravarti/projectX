import { render, screen, fireEvent } from "@testing-library/react"
import { FileItem } from "@/app/components/chat-input/file-items"

// Mock dependencies
jest.mock("@/components/ui/hover-card", () => ({
    HoverCard: ({ children }: any) => <div>{children}</div>,
    HoverCardContent: ({ children }: any) => (
        <div data-testid="hover-card-content">{children}</div>
    ),
    HoverCardTrigger: ({ children }: any) => <div>{children}</div>,
}))

jest.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: any) => <div>{children}</div>,
    TooltipContent: ({ children }: any) => <div>{children}</div>,
    TooltipTrigger: ({ children }: any) => <div>{children}</div>,
}))

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mock-url")

describe("FileItem", () => {
    const mockOnRemove = jest.fn()
    const imageFile = new File(["image contents"], "test-image.png", { type: "image/png" })
    const textFile = new File(["text contents"], "test-text.txt", { type: "text/plain" })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("renders image file correctly", () => {
        render(<FileItem file={imageFile} onRemove={mockOnRemove} />)
        expect(screen.getByText("test-image.png")).toBeInTheDocument()
        const img = screen.getAllByAltText("test-image.png")[0]
        expect(img).toBeInTheDocument()
    })

    it("renders text file correctly", () => {
        render(<FileItem file={textFile} onRemove={mockOnRemove} />)
        expect(screen.getByText("test-text.txt")).toBeInTheDocument()
        expect(screen.getByText("TXT")).toBeInTheDocument()
    })

    it("calls onRemove when remove button is clicked", () => {
        render(<FileItem file={textFile} onRemove={mockOnRemove} />)
        const removeButton = screen.getByLabelText("Remove file")
        fireEvent.click(removeButton)
        expect(mockOnRemove).toHaveBeenCalledWith(textFile)
    })
})
