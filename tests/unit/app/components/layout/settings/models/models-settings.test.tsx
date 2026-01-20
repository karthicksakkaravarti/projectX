import { render, screen, fireEvent } from "@testing-library/react"
import { ModelsSettings } from "@/app/components/layout/settings/models/models-settings"
import { useModel } from "@/lib/model-store/provider"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useFavoriteModels } from "@/app/components/layout/settings/models/use-favorite-models"

// Mock dependencies
jest.mock("@/lib/model-store/provider", () => ({
    useModel: jest.fn(),
}))

jest.mock("@/lib/user-preference-store/provider", () => ({
    useUserPreferences: jest.fn(),
}))

jest.mock("@/app/components/layout/settings/models/use-favorite-models", () => ({
    useFavoriteModels: jest.fn(),
}))

jest.mock("@/lib/providers", () => ({
    PROVIDERS: [
        { id: "openai", name: "OpenAI" },
        { id: "anthropic", name: "Anthropic" },
    ],
}))

jest.mock("framer-motion", () => ({
    Reorder: {
        Group: ({ children, axis, onReorder }: any) => <div data-testid="reorder-group">{children}</div>,
        Item: ({ children }: any) => <div data-testid="reorder-item">{children}</div>
    },
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>
    },
    AnimatePresence: ({ children }: any) => <>{children}</>
}))

// Mock phosphor icons to avoid render issues if they are complex
jest.mock("@phosphor-icons/react", () => ({
    DotsSixVerticalIcon: () => <span data-testid="drag-handle" />,
    MinusIcon: () => <span data-testid="minus-icon" />,
    PlusIcon: () => <span data-testid="plus-icon" />,
    StarIcon: () => <span data-testid="star-icon" />,
}))

describe("ModelsSettings", () => {
    const mockUpdateFavoriteModels = jest.fn()
    const mockUpdateFavoriteModelsDebounced = jest.fn()
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
                isModelHidden: mockIsModelHidden,
            })
        mockIsModelHidden.mockReturnValue(false)

            ; (useFavoriteModels as jest.Mock).mockReturnValue({
                favoriteModels: ["gpt-4"],
                updateFavoriteModels: mockUpdateFavoriteModels,
                updateFavoriteModelsDebounced: mockUpdateFavoriteModelsDebounced,
            })
    })

    it("should render favorites and available models", () => {
        render(<ModelsSettings />)

        expect(screen.getByText("Your favorites (1)")).toBeInTheDocument()
        expect(screen.getByText("GPT-4")).toBeInTheDocument() // In favorites

        expect(screen.getByText("Available models")).toBeInTheDocument()
        expect(screen.getByText("GPT-3.5")).toBeInTheDocument() // In available
        expect(screen.getByText("Claude 3")).toBeInTheDocument() // In available
    })

    it("should not show hidden models", () => {
        mockIsModelHidden.mockImplementation((id) => id === "gpt-3.5")
        render(<ModelsSettings />)

        expect(screen.queryByText("GPT-3.5")).not.toBeInTheDocument()
        expect(screen.getByText("Claude 3")).toBeInTheDocument()
    })

    it("should remove from favorites", () => {
        // Need more than 1 favorite to allow removal
        ; (useFavoriteModels as jest.Mock).mockReturnValue({
            favoriteModels: ["gpt-4", "gpt-3.5"],
            updateFavoriteModels: mockUpdateFavoriteModels,
            updateFavoriteModelsDebounced: mockUpdateFavoriteModelsDebounced,
        })

        render(<ModelsSettings />)

        // Find remove buttons (MinusIcon)
        const removeButtons = screen.getAllByTitle("Remove from favorites")
        fireEvent.click(removeButtons[0])

        expect(mockUpdateFavoriteModels).toHaveBeenCalledWith(["gpt-3.5"])
    })

    it("should add to favorites", () => {
        render(<ModelsSettings />)

        // GPT-3.5 is available, try to add it
        // Find the add button for GPT-3.5
        // Structure: Available -> Provider -> Model -> Button with PlusIcon
        // It's the first available one since GPT-4 is favorite

        const addButtons = screen.getAllByTitle("Add to favorites")
        fireEvent.click(addButtons[0]) // Adds GPT-3.5 (assuming usage order)

        // Existing was ["gpt-4"], adding "gpt-3.5" -> ["gpt-4", "gpt-3.5"]
        expect(mockUpdateFavoriteModels).toHaveBeenCalledWith(["gpt-4", "gpt-3.5"])
    })

    it("should allow searching available models", () => {
        render(<ModelsSettings />)

        const searchInput = screen.getByPlaceholderText("Search models...")
        fireEvent.change(searchInput, { target: { value: "claude" } })

        expect(screen.queryByText("GPT-3.5")).not.toBeInTheDocument()
        expect(screen.getByText("Claude 3")).toBeInTheDocument()
    })

    it("should show empty state when no favorites", () => {
        ; (useFavoriteModels as jest.Mock).mockReturnValue({
            favoriteModels: [],
            updateFavoriteModels: mockUpdateFavoriteModels,
            updateFavoriteModelsDebounced: mockUpdateFavoriteModelsDebounced,
        })

        render(<ModelsSettings />)

        expect(screen.getByText("No favorite models yet")).toBeInTheDocument()
    })
})
