import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { OllamaSection } from "@/app/components/layout/settings/connections/ollama-section"
import { toast } from "@/components/ui/toast"


// Mock the toast component
jest.mock("@/components/ui/toast", () => ({
    toast: jest.fn(),
}))

// Mock utils
jest.mock("@/lib/utils", () => ({
    ...jest.requireActual("@/lib/utils"),
    isLocalhost: jest.fn(),
}))

import { isLocalhost } from "@/lib/utils"

// Mock fetch
global.fetch = jest.fn()

describe("OllamaSection", () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockClear()
            // Default to localhost
            ; (isLocalhost as jest.Mock).mockReturnValue(true)
    })

    it("renders default state correctly in development mode", () => {
        // isLocalhost is already true by default
        render(<OllamaSection />)

        expect(screen.getByText("Local Model Settings")).toBeInTheDocument()
        expect(screen.getByText("Ollama")).toBeInTheDocument()

        // Check if endpoint input has default value
        const input = screen.getByLabelText("Endpoint") as HTMLInputElement
        expect(input.value).toBe("http://localhost:11434")
        expect(input).not.toBeDisabled()

        // Check switch is present (by role)
        const switchElement = screen.getByRole("switch")
        expect(switchElement).toBeInTheDocument()
    })

    it("shows locked state when not on localhost", () => {
        // Mock isLocalhost to false
        ; (isLocalhost as jest.Mock).mockReturnValue(false)

        render(<OllamaSection />)

        expect(screen.getByText("Ollama is disabled in production mode.")).toBeInTheDocument()
        expect(screen.getByText("Endpoint is read-only in production mode.")).toBeInTheDocument()

        const input = screen.getByLabelText("Endpoint")
        expect(input).toBeDisabled()

        const switchElement = screen.getByRole("switch")
        expect(switchElement).toBeDisabled()
    })

    it("updates endpoint value when input changes", () => {
        render(<OllamaSection />)

        const input = screen.getByLabelText("Endpoint")
        fireEvent.change(input, { target: { value: "http://custom-host:11434" } })

        expect((input as HTMLInputElement).value).toBe("http://custom-host:11434")
    })

    it("disables input when switch is toggled off", () => {
        render(<OllamaSection />)

        const switchElement = screen.getByRole("switch")
        fireEvent.click(switchElement)

        const input = screen.getByLabelText("Endpoint")
        expect(input).toBeDisabled()

        // Test Connection button should not be visible or blocked
        const testButton = screen.queryByText("Test Connection")
        expect(testButton).not.toBeInTheDocument()
    })

    it("handles successful connection test", async () => {
        ; (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        })

        render(<OllamaSection />)

        const testButton = screen.getByText("Test Connection")
        fireEvent.click(testButton)

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("http://localhost:11434/api/tags")
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: "Ollama connection successful",
            }))
        })
    })

    it("handles failed connection test (response not ok)", async () => {
        ; (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
        })

        render(<OllamaSection />)

        const testButton = screen.getByText("Test Connection")
        fireEvent.click(testButton)

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: "Ollama connection failed",
            }))
        })
    })

    it("handles failed connection test (network error)", async () => {
        ; (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"))

        render(<OllamaSection />)

        const testButton = screen.getByText("Test Connection")
        fireEvent.click(testButton)

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: "Ollama connection failed",
            }))
        })
    })
})
