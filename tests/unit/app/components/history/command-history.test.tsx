import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CommandHistory } from "@/app/components/history/command-history"
import { useRouter } from "next/navigation"
import { useChatSession } from "@/lib/chat-store/session/provider"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useChatPreview } from "@/lib/hooks/use-chat-preview"

jest.mock("next/navigation")
jest.mock("@/lib/chat-store/session/provider")
jest.mock("@/lib/chat-store/chats/provider")
jest.mock("@/lib/user-preference-store/provider")
jest.mock("@/lib/hooks/use-chat-preview")
jest.mock("@/app/hooks/use-key-shortcut")
jest.mock("@/app/components/history/chat-preview-panel", () => ({
    ChatPreviewPanel: () => <div data-testid="chat-preview">Preview Content</div>,
}))

describe("CommandHistory", () => {
    const mockRouter = { push: jest.fn(), prefetch: jest.fn() }
    const mockOnSaveEdit = jest.fn()
    const mockOnConfirmDelete = jest.fn()
    const mockTogglePinned = jest.fn()
    const mockFetchPreview = jest.fn()
    const mockClearPreview = jest.fn()

    const mockChats = [
        { id: "1", title: "Chat 1", updated_at: new Date().toISOString() },
        { id: "2", title: "Chat 2", updated_at: new Date().toISOString() },
    ] as any

    beforeEach(() => {
        jest.clearAllMocks()
            ; (useRouter as jest.Mock).mockReturnValue(mockRouter)
            ; (useChatSession as jest.Mock).mockReturnValue({ chatId: "current" })
            ; (useChats as jest.Mock).mockReturnValue({
                pinnedChats: [],
                togglePinned: mockTogglePinned
            })
            ; (useUserPreferences as jest.Mock).mockReturnValue({
                preferences: { showConversationPreviews: true }
            })
            ; (useChatPreview as jest.Mock).mockReturnValue({
                messages: [],
                isLoading: false,
                error: null,
                fetchPreview: mockFetchPreview,
                clearPreview: mockClearPreview,
            })
    })

    it("should render command items for each chat", () => {
        render(
            <CommandHistory
                chatHistory={mockChats}
                onSaveEdit={mockOnSaveEdit}
                onConfirmDelete={mockOnConfirmDelete}
                trigger={<button>Trigger</button>}
                isOpen={true}
                setIsOpen={jest.fn()}
            />
        )

        expect(screen.getByText("Chat 1")).toBeInTheDocument()
        expect(screen.getByText("Chat 2")).toBeInTheDocument()
    })

    it("should filter chats based on search query", () => {
        render(
            <CommandHistory
                chatHistory={mockChats}
                onSaveEdit={mockOnSaveEdit}
                onConfirmDelete={mockOnConfirmDelete}
                trigger={<button>Trigger</button>}
                isOpen={true}
                setIsOpen={jest.fn()}
            />
        )

        const input = screen.getByPlaceholderText("Search history...")
        fireEvent.change(input, { target: { value: "Chat 1" } })

        expect(screen.getByText("Chat 1")).toBeInTheDocument()
        expect(screen.queryByText("Chat 2")).not.toBeInTheDocument()
    })

    it("should call onSaveEdit when editing a chat", async () => {
        render(
            <CommandHistory
                chatHistory={mockChats}
                onSaveEdit={mockOnSaveEdit}
                onConfirmDelete={mockOnConfirmDelete}
                trigger={<button>Trigger</button>}
                isOpen={true}
                setIsOpen={jest.fn()}
            />
        )

        const editButtons = screen.getAllByLabelText("Edit")
        fireEvent.click(editButtons[0])

        const input = screen.getByDisplayValue("Chat 1")
        fireEvent.change(input, { target: { value: "Updated Title" } })

        const confirmButton = screen.getByLabelText("Confirm")
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(mockOnSaveEdit).toHaveBeenCalledWith("1", "Updated Title")
        })
    })

    it("should call onConfirmDelete when deleting a chat", async () => {
        render(
            <CommandHistory
                chatHistory={mockChats}
                onSaveEdit={mockOnSaveEdit}
                onConfirmDelete={mockOnConfirmDelete}
                trigger={<button>Trigger</button>}
                isOpen={true}
                setIsOpen={jest.fn()}
            />
        )

        const deleteButtons = screen.getAllByLabelText("Delete")
        fireEvent.click(deleteButtons[0])

        const confirmButton = screen.getByLabelText("Confirm")
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(mockOnConfirmDelete).toHaveBeenCalledWith("1")
        })
    })

    it("should call router.push when a chat item is selected", () => {
        render(
            <CommandHistory
                chatHistory={mockChats}
                onSaveEdit={mockOnSaveEdit}
                onConfirmDelete={mockOnConfirmDelete}
                trigger={<button>Trigger</button>}
                isOpen={true}
                setIsOpen={jest.fn()}
            />
        )

        fireEvent.click(screen.getByText("Chat 2"))
        expect(mockRouter.push).toHaveBeenCalledWith("/c/2")
    })

    it("should toggle pin status", () => {
        render(
            <CommandHistory
                chatHistory={mockChats}
                onSaveEdit={mockOnSaveEdit}
                onConfirmDelete={mockOnConfirmDelete}
                trigger={<button>Trigger</button>}
                isOpen={true}
                setIsOpen={jest.fn()}
            />
        )

        const pinButtons = screen.getAllByLabelText("Pin")
        fireEvent.click(pinButtons[0])

        expect(mockTogglePinned).toHaveBeenCalledWith("1", true)
    })

    it("should fetch preview on hover when enabled", () => {
        render(
            <CommandHistory
                chatHistory={mockChats}
                onSaveEdit={mockOnSaveEdit}
                onConfirmDelete={mockOnConfirmDelete}
                trigger={<button>Trigger</button>}
                isOpen={true}
                setIsOpen={jest.fn()}
            />
        )

        const chatItem = screen.getByText("Chat 1").closest("[cmdk-item]")!
        fireEvent.mouseEnter(chatItem)

        expect(mockFetchPreview).toHaveBeenCalledWith("1")
        expect(screen.getByTestId("chat-preview")).toBeInTheDocument()
    })
})
