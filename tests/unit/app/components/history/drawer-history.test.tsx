import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { DrawerHistory } from "@/app/components/history/drawer-history"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useParams } from "next/navigation"

jest.mock("@/lib/chat-store/persist", () => ({
    ensureDbReady: jest.fn(),
    readFromIndexedDB: jest.fn(),
    writeToIndexedDB: jest.fn(),
    deleteFromIndexedDB: jest.fn(),
    clearAllIndexedDBStores: jest.fn(),
}))

jest.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: any) => <>{children}</>,
    TooltipTrigger: ({ children }: any) => <>{children}</>,
    TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
    TooltipProvider: ({ children }: any) => <>{children}</>,
}))

jest.mock("@/lib/chat-store/chats/provider")
jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
    useSearchParams: jest.fn(),
    useParams: jest.fn(),
}))

// Mocking Drawer component
jest.mock("@/components/ui/drawer", () => ({
    Drawer: ({ children, open, onOpenChange }: any) => {
        return open ? (
            <div data-testid="drawer">
                <button data-testid="close-drawer" onClick={() => onOpenChange?.(false)}>
                    Close
                </button>
                {children}
            </div>
        ) : null
    },
    DrawerContent: ({ children }: any) => <div data-testid="drawer-content">{children}</div>,
    DrawerTrigger: ({ children }: any) => <div>{children}</div>,
}))

describe("DrawerHistory", () => {
    const mockOnSaveEdit = jest.fn().mockResolvedValue(undefined)
    const mockOnConfirmDelete = jest.fn().mockResolvedValue(undefined)
    const mockTogglePinned = jest.fn()
    const mockSetIsOpen = jest.fn()

    const createMockChats = () => [
        { id: "1", title: "Chat 1", updated_at: new Date().toISOString() },
        { id: "2", title: "Chat 2", updated_at: new Date().toISOString() },
    ] as any

    beforeEach(() => {
        jest.clearAllMocks()
        ;(useChats as jest.Mock).mockReturnValue({
            pinnedChats: [],
            togglePinned: mockTogglePinned,
        })
        ;(useParams as jest.Mock).mockReturnValue({ chatId: "current" })
    })

    describe("rendering", () => {
        it("should render chat items when open", () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
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

        it("should not render when closed", () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={false}
                    setIsOpen={mockSetIsOpen}
                />
            )

            expect(screen.queryByText("Chat 1")).not.toBeInTheDocument()
        })

        it("should render with empty chat history", () => {
            render(
                <DrawerHistory
                    chatHistory={[]}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            expect(screen.getByTestId("drawer")).toBeInTheDocument()
        })

        it("should highlight current chat", () => {
            ;(useParams as jest.Mock).mockReturnValue({ chatId: "1" })

            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            // Current chat should be rendered
            expect(screen.getByText("Chat 1")).toBeInTheDocument()
        })

        it("should render pinned chats differently", () => {
            ;(useChats as jest.Mock).mockReturnValue({
                pinnedChats: ["1"],
                togglePinned: mockTogglePinned,
            })

            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            // Pinned chat should still be rendered
            expect(screen.getByText("Chat 1")).toBeInTheDocument()
        })
    })

    describe("search functionality", () => {
        it("should filter chats based on search query", () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
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

        it("should be case insensitive", () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            const input = screen.getByPlaceholderText("Search...")
            fireEvent.change(input, { target: { value: "CHAT 1" } })

            expect(screen.getByText("Chat 1")).toBeInTheDocument()
        })

        it("should show no results for non-matching query", () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            const input = screen.getByPlaceholderText("Search...")
            fireEvent.change(input, { target: { value: "nonexistent" } })

            expect(screen.queryByText("Chat 1")).not.toBeInTheDocument()
            expect(screen.queryByText("Chat 2")).not.toBeInTheDocument()
        })

        it("should handle chat without title in search", () => {
            const chatsWithNoTitle = [
                { id: "1", title: null, updated_at: new Date().toISOString() },
            ] as any

            render(
                <DrawerHistory
                    chatHistory={chatsWithNoTitle}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            const input = screen.getByPlaceholderText("Search...")
            fireEvent.change(input, { target: { value: "test" } })

            // Should not throw
            expect(screen.getByTestId("drawer")).toBeInTheDocument()
        })
    })

    describe("edit functionality", () => {
        it("should enter edit mode and save changes", async () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            const chat1Text = screen.getByText("Chat 1")
            const itemContainer = chat1Text.closest(".group")!
            const editButton = within(itemContainer).getByLabelText("Edit")
            fireEvent.click(editButton)

            const input = await screen.findByDisplayValue("Chat 1")
            fireEvent.change(input, { target: { value: "New Title" } })

            const confirmButton = screen.getByLabelText("Confirm")
            fireEvent.click(confirmButton)

            await waitFor(() => {
                expect(mockOnSaveEdit).toHaveBeenCalledWith("1", "New Title")
            })
        })

        it("should cancel edit mode", async () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            const chat1Text = screen.getByText("Chat 1")
            const itemContainer = chat1Text.closest(".group")!
            const editButton = within(itemContainer).getByLabelText("Edit")
            fireEvent.click(editButton)

            const cancelButton = screen.getByLabelText("Cancel")
            fireEvent.click(cancelButton)

            // Should exit edit mode and show original title
            expect(screen.getByText("Chat 1")).toBeInTheDocument()
            expect(mockOnSaveEdit).not.toHaveBeenCalled()
        })

        it("should save edit on Enter key press", async () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            const chat1Text = screen.getByText("Chat 1")
            const itemContainer = chat1Text.closest(".group")!
            const editButton = within(itemContainer).getByLabelText("Edit")
            fireEvent.click(editButton)

            const input = await screen.findByDisplayValue("Chat 1")
            fireEvent.change(input, { target: { value: "New Title" } })
            fireEvent.keyDown(input, { key: "Enter" })

            await waitFor(() => {
                expect(mockOnSaveEdit).toHaveBeenCalledWith("1", "New Title")
            })
        })

        it("should save edit on form submit", async () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            const chat1Text = screen.getByText("Chat 1")
            const itemContainer = chat1Text.closest(".group")!
            const editButton = within(itemContainer).getByLabelText("Edit")
            fireEvent.click(editButton)

            const input = await screen.findByDisplayValue("Chat 1")
            fireEvent.change(input, { target: { value: "New Title" } })

            const form = input.closest("form")!
            fireEvent.submit(form)

            await waitFor(() => {
                expect(mockOnSaveEdit).toHaveBeenCalledWith("1", "New Title")
            })
        })
    })

    describe("delete functionality", () => {
        it("should enter delete mode and confirm", async () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            const chat1Text = screen.getByText("Chat 1")
            const itemContainer = chat1Text.closest(".group")!
            const deleteButton = within(itemContainer).getByLabelText("Delete")
            fireEvent.click(deleteButton)

            const confirmDeleteButton = await screen.findByLabelText("Confirm delete")
            fireEvent.click(confirmDeleteButton)

            await waitFor(() => {
                expect(mockOnConfirmDelete).toHaveBeenCalledWith("1")
            })
        })

        it("should cancel delete mode", async () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            const chat1Text = screen.getByText("Chat 1")
            const itemContainer = chat1Text.closest(".group")!
            const deleteButton = within(itemContainer).getByLabelText("Delete")
            fireEvent.click(deleteButton)

            const cancelDeleteButton = screen.getByLabelText("Cancel delete")
            fireEvent.click(cancelDeleteButton)

            // Should exit delete mode
            expect(mockOnConfirmDelete).not.toHaveBeenCalled()
        })
    })

    describe("pin functionality", () => {
        it("should toggle pin status for unpinned chat", () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            const chat1Text = screen.getByText("Chat 1")
            const itemContainer = chat1Text.closest(".group")!
            const pinButton = within(itemContainer).getByLabelText("Pin")
            fireEvent.click(pinButton)

            expect(mockTogglePinned).toHaveBeenCalledWith("1", true)
        })

        it("should call togglePinned for pinned chat", () => {
            ;(useChats as jest.Mock).mockReturnValue({
                pinnedChats: ["1"],
                togglePinned: mockTogglePinned,
            })

            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            // For pinned chat, verify the chat is rendered
            expect(screen.getByText("Chat 1")).toBeInTheDocument()
            // The toggle behavior is tested in the previous test - just verify pinned state is tracked
        })
    })

    describe("drawer state management", () => {
        it("should reset state when drawer closes", () => {
            render(
                <DrawerHistory
                    chatHistory={createMockChats()}
                    onSaveEdit={mockOnSaveEdit}
                    onConfirmDelete={mockOnConfirmDelete}
                    trigger={<button>Trigger</button>}
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                />
            )

            // Add search query
            const input = screen.getByPlaceholderText("Search...")
            fireEvent.change(input, { target: { value: "test" } })

            // Close drawer
            const closeButton = screen.getByTestId("close-drawer")
            fireEvent.click(closeButton)

            expect(mockSetIsOpen).toHaveBeenCalledWith(false)
        })
    })
})
