import { render, screen, fireEvent } from "@testing-library/react"
import { ChatInput } from "@/app/components/chat-input/chat-input"
import { getModelInfo } from "@/lib/models"
import userEvent from "@testing-library/user-event"
import React from "react"

// Mock dependencies
jest.mock("@/lib/models", () => ({
    getModelInfo: jest.fn(),
}))

// Mock sub-components
jest.mock("@/app/components/chat-input/button-file-upload", () => ({
    ButtonFileUpload: ({ onFileUpload }: any) => (
        <button onClick={() => onFileUpload([new File([], "pasted.png")])}>Upload</button>
    ),
}))

jest.mock("@/app/components/chat-input/button-search", () => ({
    ButtonSearch: ({ isSelected, onToggle }: any) => (
        <button onClick={() => onToggle(!isSelected)}>
            {isSelected ? "Search ON" : "Search OFF"}
        </button>
    ),
}))

jest.mock("@/app/components/chat-input/file-list", () => ({
    FileList: ({ files, onFileRemove }: any) => (
        <div data-testid="file-list">
            {files.map((f: any) => (
                <div key={f.name}>
                    {f.name}
                    <button onClick={() => onFileRemove(f)}>Remove {f.name}</button>
                </div>
            ))}
        </div>
    ),
}))

jest.mock("@/app/components/suggestions/prompt-system", () => ({
    PromptSystem: ({ onSuggestion }: any) => (
        <button onClick={() => onSuggestion("suggested text")}>Suggest</button>
    ),
}))

jest.mock("@/components/common/model-selector/base", () => ({
    ModelSelector: () => <div data-testid="model-selector">Model Selector</div>,
}))

jest.mock("@/components/prompt-kit/prompt-input", () => ({
    PromptInput: ({ children }: any) => <div>{children}</div>,
    PromptInputTextarea: require('react').forwardRef(({ value, onValueChange, onKeyDown, onPaste, placeholder }: any, ref: any) => (
        <textarea
            ref={ref}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder={placeholder}
            data-testid="chat-textarea"
        />
    )),
    PromptInputActions: ({ children }: any) => <div>{children}</div>,
    PromptInputAction: ({ children }: any) => <div>{children}</div>,
}))

describe("ChatInput", () => {
    const mockProps = {
        value: "",
        onValueChange: jest.fn(),
        onSend: jest.fn(),
        isSubmitting: false,
        files: [],
        onFileUpload: jest.fn(),
        onFileRemove: jest.fn(),
        onSuggestion: jest.fn(),
        hasSuggestions: true,
        onSelectModel: jest.fn(),
        selectedModel: "gpt-4",
        isUserAuthenticated: true,
        stop: jest.fn(),
        status: "ready" as const,
        setEnableSearch: jest.fn(),
        enableSearch: false,
    }

    beforeEach(() => {
        jest.clearAllMocks()
            ; (getModelInfo as jest.Mock).mockReturnValue({ webSearch: true })
    })

    it("renders correctly", () => {
        render(<ChatInput {...mockProps} />)
        expect(screen.getByTestId("chat-textarea")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument()
    })

    it("calls onSend when clicking send button with value", () => {
        render(<ChatInput {...mockProps} value="hello" />)
        fireEvent.click(screen.getByRole("button", { name: /send message/i }))
        expect(mockProps.onSend).toHaveBeenCalled()
    })

    it("calls stop when clicking button while streaming", () => {
        render(<ChatInput {...mockProps} status="streaming" value="hello" />)
        fireEvent.click(screen.getByRole("button", { name: /stop/i }))
        expect(mockProps.stop).toHaveBeenCalled()
    })

    it("handles Enter key for sending", () => {
        render(<ChatInput {...mockProps} value="hello" />)
        fireEvent.keyDown(screen.getByTestId("chat-textarea"), { key: "Enter", shiftKey: false })
        expect(mockProps.onSend).toHaveBeenCalled()
    })

    it("pre-fills quoted text", () => {
        const quotedText = { text: "hello", messageId: "1" }
        render(<ChatInput {...mockProps} quotedText={quotedText} />)
        expect(mockProps.onValueChange).toHaveBeenCalledWith("> hello\n\n")
    })
})
