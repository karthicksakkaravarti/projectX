import { render, screen } from "@testing-library/react"
import { ButtonFileUpload } from "@/app/components/chat-input/button-file-upload"
import { getModelInfo } from "@/lib/models"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import userEvent from "@testing-library/user-event"

// Mock dependencies
jest.mock("@/lib/models", () => ({
    getModelInfo: jest.fn(),
}))

jest.mock("@/lib/supabase/config", () => ({
    isSupabaseEnabled: true,
}))

// Mock UI components to simplify testing
jest.mock("@/components/ui/button", () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock("@/components/ui/popover", () => ({
    Popover: ({ children }: any) => <div>{children}</div>,
    PopoverContent: ({ children, className }: any) => (
        <div className={className} data-testid="popover-content">
            {children}
        </div>
    ),
    PopoverTrigger: ({ children }: any) => <div>{children}</div>,
}))

jest.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: any) => <div>{children}</div>,
    TooltipContent: ({ children }: any) => <div>{children}</div>,
    TooltipTrigger: ({ children }: any) => <div>{children}</div>,
}))

jest.mock("@/app/components/chat-input/popover-content-auth", () => ({
    PopoverContentAuth: () => <div data-testid="popover-auth">Auth Content</div>,
}))

jest.mock("@/components/prompt-kit/file-upload", () => ({
    FileUpload: ({ children, onFilesAdded, multiple, disabled, accept }: any) => (
        <div data-testid="file-upload">
            <input
                type="file"
                data-testid="file-input"
                multiple={multiple}
                disabled={disabled}
                accept={accept}
                onChange={(e) => {
                    if (e.target.files && onFilesAdded) {
                        onFilesAdded(Array.from(e.target.files));
                    }
                }}
            />
            {children}
        </div>
    ),
    FileUploadContent: ({ children }: any) => <div>{children}</div>,
    FileUploadTrigger: ({ children }: any) => <div>{children}</div>,
}))

describe("ButtonFileUpload", () => {
    const mockOnFileUpload = jest.fn()
    const defaultProps = {
        onFileUpload: mockOnFileUpload,
        isUserAuthenticated: true,
        model: "gpt-4",
    }

    beforeEach(() => {
        jest.clearAllMocks()
            ; (getModelInfo as jest.Mock).mockReturnValue({ vision: true })
    })

    it("renders upload button when authenticated and model supports vision", () => {
        render(<ButtonFileUpload {...defaultProps} />)
        expect(screen.getByRole("button", { name: /add files/i })).toBeInTheDocument()
        expect(screen.getByTestId("file-input")).toBeEnabled()
    })

    it("renders popover explaining lack of support if model does not support vision", () => {
        (getModelInfo as jest.Mock).mockReturnValue({ vision: false })

        render(<ButtonFileUpload {...defaultProps} />)

        expect(screen.getByRole("button", { name: /add files/i })).toBeInTheDocument()
        expect(screen.getByText(/This model does not support file uploads/i)).toBeInTheDocument()
    })

    it("renders auth popover if user is not authenticated", () => {
        render(<ButtonFileUpload {...defaultProps} isUserAuthenticated={false} />)

        expect(screen.getByRole("button", { name: /add files/i })).toBeInTheDocument()
        expect(screen.getByTestId("popover-auth")).toBeInTheDocument()
    })

    it("calls onFileUpload when files are selected", async () => {
        const user = userEvent.setup()
        render(<ButtonFileUpload {...defaultProps} />)

        const file = new File(["hello"], "hello.png", { type: "image/png" })
        const input = screen.getByTestId("file-input")

        await user.upload(input, file)

        expect(mockOnFileUpload).toHaveBeenCalledTimes(1)
        expect(mockOnFileUpload).toHaveBeenCalledWith([expect.any(File)])
        expect(mockOnFileUpload.mock.calls[0][0][0].name).toBe("hello.png")
    })

    it("has correct accept attributes", () => {
        render(<ButtonFileUpload {...defaultProps} />)
        const input = screen.getByTestId("file-input")
        expect(input).toHaveAttribute("accept", ".txt,.md,image/jpeg,image/png,image/gif,image/webp,image/svg,image/heic,image/heif")
    })
})
