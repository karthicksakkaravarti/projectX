import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PopoverContentAuth } from "@/app/components/chat-input/popover-content-auth"
import { signInWithGoogle } from "@/lib/api"
import { createClient } from "@/lib/supabase/client"

// Mock dependencies
jest.mock("@/lib/api", () => ({
    signInWithGoogle: jest.fn(),
}))

jest.mock("@/lib/supabase/client", () => ({
    createClient: jest.fn(),
}))

jest.mock("@/lib/supabase/config", () => ({
    isSupabaseEnabled: true,
}))

jest.mock("@/components/ui/button", () => ({
    Button: ({ children, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
}))

jest.mock("@/components/ui/popover", () => ({
    PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
}))

describe("PopoverContentAuth", () => {
    const mockSupabase = {
        auth: {
            signInWithOAuth: jest.fn(),
        },
    }

    beforeEach(() => {
        jest.clearAllMocks()
            ; (createClient as jest.Mock).mockReturnValue(mockSupabase)
        // Setup window.location.href mock
        delete (window as any).location
        window.location = { href: "" } as any
    })

    it("renders correctly", () => {
        render(<PopoverContentAuth />)
        expect(screen.getByText(/Login to try more features for free/i)).toBeInTheDocument()
        expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument()
    })

    it("handles successful sign in and redirects", async () => {
        (signInWithGoogle as jest.Mock).mockResolvedValue({ url: "https://auth-url.com" })

        render(<PopoverContentAuth />)
        fireEvent.click(screen.getByText(/Continue with Google/i))

        expect(screen.getByText(/Connecting\.\.\./i)).toBeInTheDocument()

        await waitFor(() => {
            expect(window.location.href).toBe("https://auth-url.com")
        })
    })

    it("displays error message on sign in failure", async () => {
        (signInWithGoogle as jest.Mock).mockRejectedValue(new Error("Failed to sign in"))

        render(<PopoverContentAuth />)
        fireEvent.click(screen.getByText(/Continue with Google/i))

        await waitFor(() => {
            expect(screen.getByText("Failed to sign in")).toBeInTheDocument()
        })
    })
})
