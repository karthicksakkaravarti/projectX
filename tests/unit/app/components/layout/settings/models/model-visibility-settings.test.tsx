import { render, screen, fireEvent, waitFor } from "@testing-library/react"
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
        { id: "openai", name: "OpenAI", icon: () => <svg data-testid="openai-icon" /> },
        { id: "anthropic", name: "Anthropic", icon: () => <svg data-testid="anthropic-icon" /> },
    ],
}))

jest.mock("@/components/ui/switch", () => ({
    Switch: ({ checked, onCheckedChange, className }: any) => (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={className}
            data-testid="switch"
        />
    ),
}))

describe("ModelVisibilitySettings", () => {
    const mockToggleModelVisibility = jest.fn()
    const mockIsModelHidden = jest.fn()

    const mockModels = [
        { id: "gpt-4", name: "GPT-4", icon: "openai", provider: "openai" },
        { id: "gpt-3.5", name: "GPT-3.5", icon: "openai", provider: "openai" },
        { id: "claude-3", name: "Claude 3", icon: "anthropic", provider: "anthropic" },
    ]

    beforeEach(() => {
        jest.clearAllMocks()

            ; (useModel as jest.Mock).mockReturnValue({
                models: mockModels,
            })

            ; (useUserPreferences as jest.Mock).mockReturnValue({
                toggleModelVisibility: mockToggleModelVisibility,
                isModelHidden: mockIsModelHidden,
            })

        mockIsModelHidden.mockReturnValue(false) // All visible by default
    })

    it("should render models grouped by provider", () => {
        render(<ModelVisibilitySettings />)

        expect(screen.getByText("OpenAI")).toBeInTheDocument()
        expect(screen.getByText("Anthropic")).toBeInTheDocument()
        expect(screen.getByText("GPT-4")).toBeInTheDocument()
        expect(screen.getByText("Claude 3")).toBeInTheDocument()
    })

    it("should show provider icons", () => {
        render(<ModelVisibilitySettings />)
        expect(screen.getByTestId("openai-icon")).toBeInTheDocument()
        expect(screen.getByTestId("anthropic-icon")).toBeInTheDocument()
    })

    it("should allow searching models", () => {
        render(<ModelVisibilitySettings />)

        const searchInput = screen.getByPlaceholderText("Search models...")
        fireEvent.change(searchInput, { target: { value: "claude" } })

        expect(screen.queryByText("GPT-4")).not.toBeInTheDocument()
        expect(screen.getByText("Claude 3")).toBeInTheDocument()
    })

    it("should show empty state when search matches nothing", () => {
        render(<ModelVisibilitySettings />)

        const searchInput = screen.getByPlaceholderText("Search models...")
        fireEvent.change(searchInput, { target: { value: "nonexistent" } })

        expect(
            screen.getByText("No models found matching your search.")
        ).toBeInTheDocument()
    })

    it("should toggle model visibility", () => {
        mockIsModelHidden.mockReturnValue(false) // Initially visible
        render(<ModelVisibilitySettings />)

        // Find switches. There is one for group and one for each model.
        // The specific model switch logic is nested.
        // Let's rely on finding by role and index or structure.
        // The component renders group headers with a switch, then models with switches.

        // GPT-4 switch (index 1, assuming index 0 is OpenAI group switch)
        // Structure:
        // - OpenAI
        //   - Switch (Group)
        // - GPT-4
        //   - Switch
        // - GPT-3.5
        //   - Switch
        // - Anthropic
        //   - Switch (Group)
        // - Claude 3
        //   - Switch

        const switches = screen.getAllByRole("switch")
        // Assuming order: OpenAI Group, GPT-4, GPT-3.5, Anthropic Group, Claude 3

        const gpt4Switch = switches[1]

        fireEvent.click(gpt4Switch)

        expect(mockToggleModelVisibility).toHaveBeenCalledWith("gpt-4")
    })

    it("should toggle group visibility", () => {
        // All visible initially
        mockIsModelHidden.mockReturnValue(false)
        render(<ModelVisibilitySettings />)

        const switches = screen.getAllByRole("switch")
        const openAIGroupSwitch = switches[0]

        fireEvent.click(openAIGroupSwitch)

        // Should toggle both GPT-4 and GPT-3.5
        // But the logic in component iterates and calls toggleModelVisibility for each if needed
        expect(mockToggleModelVisibility).toHaveBeenCalledWith("gpt-4")
        expect(mockToggleModelVisibility).toHaveBeenCalledWith("gpt-3.5")
    })

    it("should show indeterminate state styling on group switch", () => {
        // GPT-4 hidden, GPT-3.5 visible
        mockIsModelHidden.mockImplementation((id) => id === "gpt-4")

        render(<ModelVisibilitySettings />)

        const switches = screen.getAllByRole("switch")
        const openAIGroupSwitch = switches[0]

        expect(openAIGroupSwitch).toHaveClass("opacity-60")
    })
})
