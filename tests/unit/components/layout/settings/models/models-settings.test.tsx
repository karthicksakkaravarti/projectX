
import { fireEvent, render, screen } from "@testing-library/react"
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
        { id: "openai", name: "OpenAI", icon: (props: any) => <svg data-testid="openai-icon" {...props} /> },
    ],
}))

// Mock framer-motion
jest.mock("framer-motion", () => ({
    Reorder: {
        Group: ({ children, className }: any) => <div className={className}>{children}</div>,
        Item: ({ children, className }: any) => <div className={className}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
        div: ({ children, className, onClick }: any) => <div className={className} onClick={onClick}>{children}</div>,
    },
}))

describe("ModelsSettings", () => {
    const mockModels = [
        { id: "gpt-4", name: "GPT-4", icon: "openai", provider: "openai", description: "Powerful model" },
        { id: "gpt-3.5", name: "GPT-3.5", icon: "openai", provider: "openai", description: "Fast model" },
    ]

    const mockFavoriteModels = ["gpt-4"]
    const mockUpdateFavoriteModels = jest.fn()
    const mockUpdateFavoriteModelsDebounced = jest.fn()
    const mockIsModelHidden = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()

            ; (useModel as jest.Mock).mockReturnValue({
                models: mockModels,
            })

            ; (useUserPreferences as jest.Mock).mockReturnValue({
                isModelHidden: mockIsModelHidden,
            })

            ; (useFavoriteModels as jest.Mock).mockReturnValue({
                favoriteModels: mockFavoriteModels,
                updateFavoriteModels: mockUpdateFavoriteModels,
                updateFavoriteModelsDebounced: mockUpdateFavoriteModelsDebounced,
            })

        mockIsModelHidden.mockReturnValue(false)
    })

    it("renders favorite and available models", () => {
        render(<ModelsSettings />)

        expect(screen.getByText("Your favorites (1)")).toBeInTheDocument()
        // GPT-4 is favorite
        expect(screen.getByText("GPT-4")).toBeInTheDocument()

        expect(screen.getByText("Available models")).toBeInTheDocument()
        // GPT-3.5 is available
        expect(screen.getByText("GPT-3.5")).toBeInTheDocument()
    })

    it("adds a model to favorites", () => {
        render(<ModelsSettings />)

        // GPT-3.5 is in available list, should have a plus button
        // The structure is list -> item -> button
        const gpt35Item = screen.getByText("GPT-3.5").closest("div[class*='flex items-center justify-between']")
        const addButton = gpt35Item?.querySelector("button")

        expect(addButton).toBeInTheDocument()
        if (addButton) fireEvent.click(addButton)

        expect(mockUpdateFavoriteModels).toHaveBeenCalledWith(["gpt-4", "gpt-3.5"])
    })

    it("removes a model from favorites", () => {
        // Need at least 2 favorites to remove one (based on component logic 'disabled={favoriteModels.length <= 1}')
        ; (useFavoriteModels as jest.Mock).mockReturnValue({
            favoriteModels: ["gpt-4", "gpt-3.5"],
            updateFavoriteModels: mockUpdateFavoriteModels,
            updateFavoriteModelsDebounced: mockUpdateFavoriteModelsDebounced,
        })

        render(<ModelsSettings />)

        // Find remove button for GPT-4
        // Structure in Reorder.Item: ... -> Remove Button (MinusIcon)
        const gpt4Item = screen.getByText("GPT-4").closest("div[class*='border-border']")
        const removeButton = gpt4Item?.querySelector("button")

        expect(removeButton).toBeInTheDocument()
        if (removeButton) fireEvent.click(removeButton)

        expect(mockUpdateFavoriteModels).toHaveBeenCalledWith(["gpt-3.5"])
    })

    it("searches available models", () => {
        render(<ModelsSettings />)

        const searchInput = screen.getByPlaceholderText("Search models...")
        fireEvent.change(searchInput, { target: { value: "3.5" } })

        expect(screen.getByText("GPT-3.5")).toBeInTheDocument()
        // GPT-4 is in favorites, so it wouldn't be in available anyway, but let's assume if it wasn't favorite
        // If we search for something non-existent
        fireEvent.change(searchInput, { target: { value: "xyz" } })
        expect(screen.getByText('No models found matching "xyz"')).toBeInTheDocument()
    })

    it("does not show hidden models", () => {
        mockIsModelHidden.mockReturnValue(true) // All hidden
        render(<ModelsSettings />)

        expect(screen.queryByText("GPT-4")).not.toBeInTheDocument()
        expect(screen.queryByText("GPT-3.5")).not.toBeInTheDocument()
    })
})
