import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { ByokSection } from "@/app/components/layout/settings/apikeys/byok-section"
import { useModel } from "@/lib/model-store/provider"
import { fetchClient } from "@/lib/fetch"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import userEvent from "@testing-library/user-event"

// Mock the dependencies
jest.mock("@/lib/model-store/provider", () => ({
    useModel: jest.fn(),
}))

jest.mock("@/lib/fetch", () => ({
    fetchClient: jest.fn(),
}))

jest.mock("@/components/ui/toast", () => ({
    toast: jest.fn(),
}))

// Mock icon components
jest.mock("@/components/icons/claude", () => () => <div data-testid="icon-claude" />)
jest.mock("@/components/icons/google", () => () => <div data-testid="icon-google" />)
jest.mock("@/components/icons/mistral", () => () => <div data-testid="icon-mistral" />)
jest.mock("@/components/icons/openai", () => () => <div data-testid="icon-openai" />)
jest.mock("@/components/icons/openrouter", () => () => <div data-testid="icon-openrouter" />)
jest.mock("@/components/icons/perplexity", () => () => <div data-testid="icon-perplexity" />)
jest.mock("@/components/icons/xai", () => () => <div data-testid="icon-xai" />)

jest.mock("@tanstack/react-query", () => ({
    useQueryClient: jest.fn(),
    useMutation: jest.fn(),
}))

describe("ByokSection", () => {
    const mockRefreshAll = jest.fn()
    const mockInvalidateQueries = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()

            // Default mock implementation for useModel
            ; (useModel as jest.Mock).mockReturnValue({
                userKeyStatus: {},
                refreshAll: mockRefreshAll,
            })

            // Default mock implementation for useQueryClient
            ; (useQueryClient as jest.Mock).mockReturnValue({
                invalidateQueries: mockInvalidateQueries,
            })

            // Default mock implementation for useMutation to execute the passed functions
            ; (useMutation as jest.Mock).mockImplementation(({ mutationFn, onSuccess, onError }) => {
                return {
                    mutate: jest.fn(async (variables) => {
                        try {
                            const result = await mutationFn(variables);
                            if (onSuccess) await onSuccess(result, variables);
                        } catch (e) {
                            if (onError) onError(e, variables);
                        }
                    }),
                    isPending: false
                }
            })
    })

    it("renders the component correctly with default selection", () => {
        render(<ByokSection />)

        // Header
        expect(screen.getByText("Model Providers")).toBeInTheDocument()

        // Check if OpenRouter is selected by default (it's the first one in the list usually or set via state)
        // The code sets default state to "openrouter"
        expect(screen.getByLabelText("OpenRouter API Key")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("sk-or-v1-...")).toBeInTheDocument()

        // Check buttons
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
    })

    it("renders provider list correctly", () => {
        render(<ByokSection />)
        expect(screen.getByText("OpenRouter")).toBeInTheDocument()
        expect(screen.getByText("OpenAI")).toBeInTheDocument()
        expect(screen.getByText("Mistral")).toBeInTheDocument()
        expect(screen.getByText("Google")).toBeInTheDocument()
        expect(screen.getByText("Perplexity")).toBeInTheDocument()
        expect(screen.getByText("XAI")).toBeInTheDocument()
        expect(screen.getByText("Claude")).toBeInTheDocument()
    })

    it("switches provider when clicked", async () => {
        render(<ByokSection />)
        const openaiButton = screen.getByText("OpenAI").closest('button')!

        fireEvent.click(openaiButton)

        expect(screen.getByLabelText("OpenAI API Key")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("sk-...")).toBeInTheDocument()
    })

    it("saves a new API key successfully", async () => {
        (fetchClient as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ isNewKey: true })
        })

        render(<ByokSection />)
        const input = screen.getByLabelText("OpenRouter API Key")
        await userEvent.type(input, "sk-or-v1-test-key")

        const saveButton = screen.getByRole("button", { name: "Save" })
        await userEvent.click(saveButton)

        await waitFor(() => {
            expect(fetchClient).toHaveBeenCalledWith("/api/user-keys", expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    provider: "openrouter",
                    apiKey: "sk-or-v1-test-key"
                })
            }))
        })

        expect(mockRefreshAll).toHaveBeenCalled()
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["favorite-models"] })
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({
            title: "API key saved",
            description: expect.stringContaining("have been added to your favorites"),
        }))
    })

    it("saves an existing API key (update) successfully", async () => {
        (fetchClient as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ isNewKey: false })
        })

        render(<ByokSection />)
        const input = screen.getByLabelText("OpenRouter API Key")
        await userEvent.type(input, "sk-or-v1-updated-key")

        const saveButton = screen.getByRole("button", { name: "Save" })
        await userEvent.click(saveButton)

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: "API key saved",
                description: expect.stringContaining("key has been updated"),
            }))
        })

        // Should NOT invalidate favorites for update usually unless logic changed, code says only if isNewKey
        expect(mockInvalidateQueries).not.toHaveBeenCalled()
    })

    it("handles save error", async () => {
        (fetchClient as jest.Mock).mockResolvedValue({
            ok: false,
        })

        render(<ByokSection />)
        const input = screen.getByLabelText("OpenRouter API Key")
        await userEvent.type(input, "sk-or-v1-fail-key")

        const saveButton = screen.getByRole("button", { name: "Save" })
        await userEvent.click(saveButton)

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: "Failed to save API key",
            }))
        })
    })

    it("shows key status indicator and delete button if key exists", () => {
        // Mock userKeyStatus to have a key for openrouter
        ; (useModel as jest.Mock).mockReturnValue({
            userKeyStatus: { openrouter: true },
            refreshAll: mockRefreshAll,
        })

        render(<ByokSection />)

        // Should show key icon (we can't easily query the icon by text, but we can search for the "Delete" button which only appears if key exists)
        expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument()

        // Should show default masked key in input if no local state overrides it yet
        // The component logic: const fallbackValue = hasKey ? provider.defaultKey : ""
        // defaultKey for openrouter is "sk-or-v1-............"
        expect(screen.getByLabelText("OpenRouter API Key")).toHaveValue("sk-or-v1-............")
    })

    it("deletes an API key successfully", async () => {
        ; (useModel as jest.Mock).mockReturnValue({
            userKeyStatus: { openrouter: true },
            refreshAll: mockRefreshAll,
        })
            ; (fetchClient as jest.Mock).mockResolvedValue({
                ok: true,
            })

        render(<ByokSection />)

        // Click Delete
        const deleteButton = screen.getByRole("button", { name: "Delete" })
        await userEvent.click(deleteButton)

        // Dialog should open
        const dialog = screen.getByRole("alertdialog")
        expect(dialog).toBeInTheDocument()
        expect(within(dialog).getByText(/Are you sure you want to delete/)).toBeInTheDocument()

        // Confirm delete
        const confirmButton = within(dialog).getByRole("button", { name: "Delete" })
        await userEvent.click(confirmButton)

        await waitFor(() => {
            expect(fetchClient).toHaveBeenCalledWith("/api/user-keys", expect.objectContaining({
                method: "DELETE",
                body: JSON.stringify({ provider: "openrouter" })
            }))
        })

        expect(mockRefreshAll).toHaveBeenCalled()
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({
            title: "API key deleted"
        }))

        // Dialog should close (checked roughly by it not being visible or removed, though testing-library sometimes keeps it in DOM if not unmounted)
        // We can check if toast was called which implies success flow completion
    })

    it("handles delete error", async () => {
        ; (useModel as jest.Mock).mockReturnValue({
            userKeyStatus: { openrouter: true },
            refreshAll: mockRefreshAll,
        })
            ; (fetchClient as jest.Mock).mockResolvedValue({
                ok: false,
            })

        render(<ByokSection />)

        const deleteButton = screen.getByRole("button", { name: "Delete" })
        await userEvent.click(deleteButton)

        const dialog = screen.getByRole("alertdialog")
        const confirmButton = within(dialog).getByRole("button", { name: "Delete" })
        await userEvent.click(confirmButton)

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: "Failed to delete API key"
            }))
        })
    })
})
