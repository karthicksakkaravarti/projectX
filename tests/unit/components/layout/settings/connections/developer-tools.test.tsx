import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { DeveloperTools } from "@/app/components/layout/settings/connections/developer-tools"
import { useQuery } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"

// Mock the dependencies
jest.mock("@tanstack/react-query", () => ({
    useQuery: jest.fn(),
}))

jest.mock("@/components/ui/toast", () => ({
    toast: jest.fn(),
}))

// Mock navigator.clipboard
const mockWriteText = jest.fn()
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText,
    },
})

describe("DeveloperTools", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("renders loading state initially", () => {
        ; (useQuery as jest.Mock).mockReturnValue({
            data: null,
            isLoading: true,
        })

        render(<DeveloperTools />)
        expect(screen.getByText("Loading connections...")).toBeInTheDocument()
    })

    it("renders the list of tools when data is available", () => {
        const mockTools = [
            {
                id: "tool1",
                name: "Test Tool 1",
                description: "Description 1",
                connected: true,
                maskedKey: "sk-****1234",
                sampleEnv: "KEY=value",
            },
            {
                id: "tool2",
                name: "Test Tool 2",
                description: "Description 2",
                connected: false,
                maskedKey: null,
                sampleEnv: "KEY2=value2",
            },
        ]

            ; (useQuery as jest.Mock).mockReturnValue({
                data: { tools: mockTools },
                isLoading: false,
            })

        render(<DeveloperTools />)

        expect(screen.getByText("Developer Tool connections")).toBeInTheDocument()
        expect(screen.getByText("Test Tool 1")).toBeInTheDocument()
        expect(screen.getByText("Test Tool 2")).toBeInTheDocument()
        expect(screen.getByText("Description 1")).toBeInTheDocument()
        expect(screen.getByText("Connected")).toBeInTheDocument() // "Connected" status
        expect(screen.getByText("Not connected")).toBeInTheDocument() // "Not connected" status
        expect(screen.getByText("Key detected:")).toBeInTheDocument()
        expect(screen.getByText("sk-****1234")).toBeInTheDocument()
    })

    it("copies environment key to clipboard when copy button is clicked", async () => {
        const mockTools = [
            {
                id: "tool1",
                name: "Test Tool",
                description: "Description",
                connected: false,
                maskedKey: null,
                sampleEnv: "TEST_KEY=123",
            },
        ]

            ; (useQuery as jest.Mock).mockReturnValue({
                data: { tools: mockTools },
                isLoading: false,
            })

        render(<DeveloperTools />)

        const copyButton = screen.getByText("Copy to clipboard")
        fireEvent.click(copyButton)

        await waitFor(() => {
            expect(mockWriteText).toHaveBeenCalledWith("TEST_KEY=123")
            expect(toast).toHaveBeenCalledWith({
                title: "Copied to clipboard",
                status: "success",
            })
        })
    })

    it("handles clipboard error gracefully", async () => {
        mockWriteText.mockRejectedValueOnce(new Error("Clipboard error"))

        const mockTools = [
            {
                id: "tool1",
                name: "Test Tool",
                description: "Description",
                connected: false,
                maskedKey: null,
                sampleEnv: "TEST_KEY=123",
            },
        ]

            ; (useQuery as jest.Mock).mockReturnValue({
                data: { tools: mockTools },
                isLoading: false,
            })

        render(<DeveloperTools />)

        const copyButton = screen.getByText("Copy to clipboard")
        fireEvent.click(copyButton)

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith({
                title: "Failed to copy to clipboard",
                status: "error",
            })
        })
    })
})
