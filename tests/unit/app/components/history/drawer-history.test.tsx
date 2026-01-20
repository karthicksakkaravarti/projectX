import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { DrawerHistory } from "@/app/components/history/drawer-history"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useParams } from "next/navigation"

jest.mock("@/lib/chat-store/chats/provider")
jest.mock("next/navigation")

// Mocking Drawer component as it's often hard to test portal-based components directly
jest.mock("@/components/ui/drawer", () => ({
    Drawer: ({ children, open }: any) => (open ? <div>{children}</div> : null),
    DrawerContent: ({ children }: any) => <div data-testid="drawer-content">{children}</div>,
    DrawerTrigger: ({ children }: any) => <div>{children}</div>,
}))

describe("DrawerHistory", () => {
    const mockOnSaveEdit = jest.fn()
    const mockOnConfirmDelete = jest.fn()
    const mockTogglePinned = jest.fn()
    const mockSetIsOpen = jest.fn()

    const mockChats = [
        { id: "1", title: "Chat 1", updated_at: new Date().toISOString() },
        { id: "2", title: "Chat 2", updated_at: new Date().toISOString() },
    ] as any

    beforeEach(() => {
        jest.clearAllMocks()
            ; (useChats as jest.Mock).mockReturnValue({
                pinnedChats: [],
                togglePinned: mockTogglePinned,
            })
            ; (useParams as jest.Mock).mockReturnValue({ chatId: "current" })
    })

    it("should render chat items when open", () => {
        render(
            <DrawerHistory
                chatHistory={mockChats}
                onSaveEdit={mockOnSaveEdit}
                onConfirmDelete={mockOnConfirmDelete}
                trigger={<button>Trigger</button>}
                isOpen={true}
                setIsOpen={mockSetIsOpen}
            />
        )

        expect(screen.getByText("Chat 1")).toBeInTheDocument()
        expect(screen.getByText("Chat 2")).toBeInTheDocument()
    })

    it("should filter chats based on search query", () => {
        render(
            <DrawerHistory
                chatHistory={mockChats}
                onSaveEdit={mockOnSaveEdit}
                onConfirmDelete={mockOnConfirmDelete}
                trigger={<button>Trigger</button>}
                isOpen={true}
                setIsOpen={mockSetIsOpen}
            />
        )

        const input = screen.getByPlaceholderText("Search...")
        fireEvent.change(input, { target: { value: "Chat 1" } })

        expect(screen.getByText("Chat 1")).toBeInTheDocument()
        expect(screen.queryByText("Chat 2")).not.toBeInTheDocument()
    })

    it("should enter edit mode and save changes", async () => {
        render(
            <DrawerHistory
                chatHistory={mockChats}
                onSaveEdit={mockOnSaveEdit}
                onConfirmDelete={mockOnConfirmDelete}
                trigger={<button>Trigger</button>}
                isOpen={true}
                setIsOpen={mockSetIsOpen}
            />
        )

        // Using test-id or finding by specific icon might be needed, 
        // but here we can find buttons by their position or role if they had labels.
        // Since they don't have aria-labels in DrawerHistory yet, I'll rely on the PencilSimple mock if available 
        // or just finding the button container.
        // Actually, I should probably add aria-labels to DrawerHistory for better testability.
        // But let's try to find it via its parent or structure.

        // For now, let's assume we can find the edit button.
        const buttons = screen.getAllByRole("button")
        // By looking at the code, for each chat there are 3 buttons: Pin, Edit, Delete.
        // Chat 1 is at index 0, so buttons 0, 1, 2 are for Chat 1.
        fireEvent.click(buttons[1]) // Edit button for Chat 1

        const input = screen.getByDisplayValue("Chat 1")
        fireEvent.change(input, { target: { value: "New Title" } })

        // After entering edit mode, there are Check and X buttons.
        const form = screen.getByRole("textbox").closest("form")!
        fireEvent.submit(form)

        await waitFor(() => {
            expect(mockOnSaveEdit).toHaveBeenCalledWith("1", "New Title")
        })
    })

    it("should enter delete mode and confirm", async () => {
        render(
            <DrawerHistory
                chatHistory={mockChats}
                onSaveEdit={mockOnSaveEdit}
                onConfirmDelete={mockOnConfirmDelete}
                trigger={<button>Trigger</button>}
                isOpen={true}
                setIsOpen={mockSetIsOpen}
            />
        )

        const buttons = screen.getAllByRole("button")
        fireEvent.click(buttons[2]) // Delete button for Chat 1

        const confirmButton = screen.getAllByRole("button").find(b => b.querySelector("svg")) // Find the check icon button
        fireEvent.submit(screen.getByRole("textbox", { hidden: true }).closest("form")!)

        await waitFor(() => {
            expect(mockOnConfirmDelete).toHaveBeenCalledWith("1")
        })
    })

    it("should toggle pin status", () => {
        render(
            <DrawerHistory
                chatHistory={mockChats}
                onSaveEdit={mockOnSaveEdit}
                onConfirmDelete={mockOnConfirmDelete}
                trigger={<button>Trigger</button>}
                isOpen={true}
                setIsOpen={mockSetIsOpen}
            />
        )

        const buttons = screen.getAllByRole("button")
        fireEvent.click(buttons[0]) // Pin button for Chat 1

        expect(mockTogglePinned).toHaveBeenCalledWith("1", true)
    })
})
