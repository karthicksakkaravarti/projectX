
import { fireEvent, render, screen } from "@testing-library/react"
import { ModelVisibilitySettings } from "@/app/components/layout/settings/models/model-visibility-settings"
import { useModel } from "@/lib/model-store/provider"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { PROVIDERS } from "@/lib/providers"

// Mock dependencies
jest.mock("@/lib/model-store/provider", () => ({
    useModel: jest.fn(),
}))

jest.mock("@/lib/user-preference-store/provider", () => ({
    useUserPreferences: jest.fn(),
}))

jest.mock("@/lib/providers", () => ({
    PROVIDERS: [
        { id: "openai", name: "OpenAI", icon: (props: any) => <svg data-testid="openai-icon" {...props} /> },
        { id: "anthropic", name: "Anthropic", icon: (props: any) => <svg data-testid="anthropic-icon" {...props} /> },
    ],
}))

jest.mock("@/components/ui/switch", () => ({
    Switch: ({ checked, onCheckedChange, className }: any) => (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={className}
        >
            Toggle
        </button>
    ),
}))

describe("ModelVisibilitySettings", () => {
    const mockModels = [
        { id: "gpt-4", name: "GPT-4", icon: "openai", provider: "openai", description: "Powerful model" },
        { id: "gpt-3.5", name: "GPT-3.5", icon: "openai", provider: "openai", description: "Fast model" },
        { id: "claude-3", name: "Claude 3", icon: "anthropic", provider: "anthropic", description: "Smart model" },
    ]

    const mockToggleModelVisibility = jest.fn()
    const mockIsModelHidden = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()

            ; (useModel as jest.Mock).mockReturnValue({
                models: mockModels,
            })

            ; (useUserPreferences as jest.Mock).mockReturnValue({
                toggleModelVisibility: mockToggleModelVisibility,
                isModelHidden: mockIsModelHidden,
            })

        mockIsModelHidden.mockReturnValue(false) // Default all visible
    })

    it("renders the component with available models", () => {
        render(<ModelVisibilitySettings />)

        expect(screen.getByText("Available models")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("Search models...")).toBeInTheDocument()

        // Check provider sections
        expect(screen.getByText("OpenAI")).toBeInTheDocument()
        expect(screen.getByText("Anthropic")).toBeInTheDocument()

        // Check models
        expect(screen.getByText("GPT-4")).toBeInTheDocument()
        expect(screen.getByText("GPT-3.5")).toBeInTheDocument()
        expect(screen.getByText("Claude 3")).toBeInTheDocument()
    })

    it("filters models via search input", () => {
        render(<ModelVisibilitySettings />)

        const searchInput = screen.getByPlaceholderText("Search models...")
        fireEvent.change(searchInput, { target: { value: "claude" } })

        expect(screen.queryByText("GPT-4")).not.toBeInTheDocument()
        expect(screen.getByText("Claude 3")).toBeInTheDocument()
        expect(screen.getByText("Anthropic")).toBeInTheDocument()
        expect(screen.queryByText("OpenAI")).not.toBeInTheDocument()
    })

    it("shows no results message when search matches nothing", () => {
        render(<ModelVisibilitySettings />)

        const searchInput = screen.getByPlaceholderText("Search models...")
        fireEvent.change(searchInput, { target: { value: "xyz" } })

        expect(screen.getByText("No models found matching your search.")).toBeInTheDocument()
    })

    it("toggles model visibility", () => {
        render(<ModelVisibilitySettings />)

        // We traverse up to find the row container
        const gpt4Span = screen.getByText("GPT-4")
        // structure: span -> div (gap-2) -> div (flex-col) -> div (row)
        // We can just look for the closest row wrapper or traverse parents
        // span -> div -> div -> div (row)
        const gpt4Row = gpt4Span.parentElement?.parentElement?.parentElement

        const gpt4Switch = gpt4Row?.querySelector('button[role="switch"]') as HTMLElement

        expect(gpt4Switch).toBeInTheDocument()
        fireEvent.click(gpt4Switch)

        expect(mockToggleModelVisibility).toHaveBeenCalledWith("gpt-4")
    })

    it("toggles group visibility", () => {
        render(<ModelVisibilitySettings />)

        // Find the OpenAI group switch
        // The OpenAI header
        const openaiHeader = screen.getByText("OpenAI")
        // structure: h4 -> div (flex items-center gap-2)
        const headerRow = openaiHeader.closest("div.flex.items-center.gap-2") || openaiHeader.parentElement
        const groupSwitch = headerRow?.querySelector('button[role="switch"]') as HTMLElement

        expect(groupSwitch).toBeInTheDocument()

        fireEvent.click(groupSwitch)

        // Should toggle both GPT-4 and GPT-3.5
        expect(mockToggleModelVisibility).toHaveBeenCalledWith("gpt-4")
        expect(mockToggleModelVisibility).toHaveBeenCalledWith("gpt-3.5")
        expect(mockToggleModelVisibility).not.toHaveBeenCalledWith("claude-3")
    })

    it("reflects hidden state correctly", () => {
        mockIsModelHidden.mockImplementation((id: string) => id === "gpt-4") // GPT-4 is hidden

        render(<ModelVisibilitySettings />)

        const gpt4Span = screen.getByText("GPT-4")
        const gpt4Row = gpt4Span.parentElement?.parentElement?.parentElement
        const gpt4Switch = gpt4Row?.querySelector('button[role="switch"]')

        // Because the switch checked prop is based on VISIBILITY, if it's hidden (isModelHidden returns true), checked should be false.
        // getModelVisibility logic: !isModelHidden(modelId)
        // So if hidden, checked=false (aria-checked="false")
        expect(gpt4Switch).toHaveAttribute("aria-checked", "false")

        const gpt35Span = screen.getByText("GPT-3.5")
        const gpt35Row = gpt35Span.parentElement?.parentElement?.parentElement
        const gpt35Switch = gpt35Row?.querySelector('button[role="switch"]')
        expect(gpt35Switch).toHaveAttribute("aria-checked", "true")
    })
})
