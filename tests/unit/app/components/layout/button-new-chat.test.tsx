import { render, screen, fireEvent } from "@testing-library/react"
import { ButtonNewChat } from "@/app/components/layout/button-new-chat"
import { usePathname, useRouter } from "next/navigation"
import { useKeyShortcut } from "@/app/hooks/use-key-shortcut"

// Mock hooks
jest.mock("next/navigation", () => ({
    usePathname: jest.fn(),
    useRouter: jest.fn(),
}))

jest.mock("@/app/hooks/use-key-shortcut", () => ({
    useKeyShortcut: jest.fn(),
}))

// Mock UI components
jest.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe("ButtonNewChat", () => {
    const mockPush = jest.fn()

    beforeEach(() => {
        ; (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        })
    })

    it("renders nothing when on the home page", () => {
        ; (usePathname as jest.Mock).mockReturnValue("/")
        const { container } = render(<ButtonNewChat />)
        expect(container).toBeEmptyDOMElement()
    })

    it("renders the button when not on the home page", () => {
        ; (usePathname as jest.Mock).mockReturnValue("/chat/123")
        render(<ButtonNewChat />)

        const link = screen.getByRole("link", { name: /new chat/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute("href", "/")
    })

    it("sets up the keyboard shortcut", () => {
        ; (usePathname as jest.Mock).mockReturnValue("/chat/123")
        render(<ButtonNewChat />)

        expect(useKeyShortcut).toHaveBeenCalledWith(
            expect.any(Function),
            expect.any(Function)
        )

        // Test the shortcut logic
        const [predicate, callback] = (useKeyShortcut as jest.Mock).mock.calls[0]

        // Should return true for Ctrl+Shift+U or Cmd+Shift+U
        expect(predicate({ key: "u", metaKey: true, shiftKey: true })).toBe(true)
        expect(predicate({ key: "U", metaKey: true, shiftKey: true })).toBe(true)
        expect(predicate({ key: "u", metaKey: false, shiftKey: true })).toBe(false)

        // Should call router.push("/")
        callback()
        expect(mockPush).toHaveBeenCalledWith("/")
    })
})
