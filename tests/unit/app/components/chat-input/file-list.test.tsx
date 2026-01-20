import { render, screen } from "@testing-library/react"
import { FileList } from "@/app/components/chat-input/file-list"

// Mock motion components
jest.mock("motion/react", () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}))

jest.mock("@/app/components/chat-input/file-items", () => ({
    FileItem: ({ file, onRemove }: any) => (
        <div data-testid={`file-item-${file.name}`}>
            {file.name}
            <button onClick={() => onRemove(file)}>Remove</button>
        </div>
    ),
}))

describe("FileList", () => {
    const mockOnFileRemove = jest.fn()
    const files = [
        new File([""], "file1.txt"),
        new File([""], "file2.png"),
    ]

    it("renders list of files", () => {
        render(<FileList files={files} onFileRemove={mockOnFileRemove} />)
        expect(screen.getByTestId("file-item-file1.txt")).toBeInTheDocument()
        expect(screen.getByTestId("file-item-file2.png")).toBeInTheDocument()
    })

    it("handles file removal", () => {
        render(<FileList files={files} onFileRemove={mockOnFileRemove} />)
        const removeButtons = screen.getAllByText("Remove")
        removeButtons[0].click()
        expect(mockOnFileRemove).toHaveBeenCalledWith(files[0])
    })
})
