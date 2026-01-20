import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { OllamaSection } from "@/app/components/layout/settings/connections/ollama-section"
import { toast } from "@/components/ui/toast"

// Mock toast
jest.mock("@/components/ui/toast", () => ({
    toast: jest.fn(),
}))

// Mock UI components
jest.mock("@/components/ui/card", () => ({
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
    CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
    CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
    CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
}))

jest.mock("@/components/ui/input", () => ({
    Input: (props: any) => <input data-testid="input" {...props} />,
}))

jest.mock("@/components/ui/switch", () => ({
    Switch: ({ checked, onCheckedChange, disabled }: any) => (
        <button
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onCheckedChange(!checked)}
            data-testid="switch"
        >
            {checked ? 'On' : 'Off'}
        </button>
    ),
}))

jest.mock("@/components/ui/button", () => ({
    Button: ({ children, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled} data-testid="button">
            {children}
        </button>
    ),
}))

// Mock fetch
global.fetch = jest.fn()

describe("OllamaSection", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("should render correctly in development mode (localhost)", () => {
        render(<OllamaSection />)

        expect(screen.getByText("Local Model Settings")).toBeInTheDocument()
        expect(screen.getByText("Ollama")).toBeInTheDocument()
        expect(screen.getByTestId("switch")).toBeInTheDocument()
        expect(screen.getByTestId("input")).toHaveValue("http://localhost:11434")
        expect(screen.getByText("Test Connection")).toBeInTheDocument()
    })

    it("should allow editing the endpoint", () => {
        render(<OllamaSection />)

        const input = screen.getByTestId("input")
        fireEvent.change(input, { target: { value: "http://custom-host:11434" } })

        expect(input).toHaveValue("http://custom-host:11434")
    })

    it("should disable input and hide button when switch is off", () => {
        render(<OllamaSection />)

        const toggle = screen.getByTestId("switch")
        // Initially on (default true)
        fireEvent.click(toggle) // Turn off

        const input = screen.getByTestId("input")
        expect(input).toBeDisabled()
        expect(screen.queryByText("Test Connection")).not.toBeInTheDocument()
    })

    it("should handle successful connection test", async () => {
        ; (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
        })

        render(<OllamaSection />)

        const testButton = screen.getByText("Test Connection")
        fireEvent.click(testButton)

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("http://localhost:11434/api/tags")
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: "Ollama connection successful"
            }))
        })
    })

    it("should handle failed connection test (response not ok)", async () => {
        ; (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
        })

        render(<OllamaSection />)

        const testButton = screen.getByText("Test Connection")
        fireEvent.click(testButton)

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: "Ollama connection failed"
            }))
        })
    })

    it("should handle failed connection test (network error)", async () => {
        ; (global.fetch as jest.Mock).mockRejectedValue(new Error("Network Error"))

        render(<OllamaSection />)

        const testButton = screen.getByText("Test Connection")
        fireEvent.click(testButton)

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: "Ollama connection failed"
            }))
        })
    })
})
