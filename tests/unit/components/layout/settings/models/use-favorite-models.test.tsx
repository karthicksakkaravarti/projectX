
import { renderHook, waitFor } from "@testing-library/react"
import { useFavoriteModels } from "@/app/components/layout/settings/models/use-favorite-models"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fetchClient } from "@/lib/fetch"
import { useModel } from "@/lib/model-store/provider"
import { useUser } from "@/lib/user-store/provider"
import { toast } from "@/components/ui/toast"

// Mock dependencies
jest.mock("@/lib/fetch")
jest.mock("@/lib/model-store/provider")
jest.mock("@/lib/user-store/provider")
jest.mock("@/components/ui/toast")
jest.mock("@/lib/utils", () => ({
    debounce: (fn: any) => fn, // Immediate execution for testing
}))

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}

describe("useFavoriteModels", () => {
    const mockRefreshFavoriteModelsSilent = jest.fn()
    const mockRefreshUser = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()

            // Mock useModel to verify initial data usage
            ; (useModel as jest.Mock).mockReturnValue({
                favoriteModels: ["initial-model"],
                refreshFavoriteModelsSilent: mockRefreshFavoriteModelsSilent,
            })

            ; (useUser as jest.Mock).mockReturnValue({
                refreshUser: mockRefreshUser,
            })
    })

    it("initializes with data from useModel", async () => {
        const { result } = renderHook(() => useFavoriteModels(), {
            wrapper: createWrapper(),
        })

        // Should be immediately available from initialData
        expect(result.current.favoriteModels).toEqual(["initial-model"])
        expect(result.current.isLoading).toBe(false)
    })

    it("updates favorite models successfully", async () => {
        // Mock the update response
        ; (fetchClient as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        })

        const { result } = renderHook(() => useFavoriteModels(), {
            wrapper: createWrapper(),
        })

        result.current.updateFavoriteModels(["new-model"])

        await waitFor(() => {
            expect(fetchClient).toHaveBeenCalledWith(
                "/api/user-preferences/favorite-models",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ favorite_models: ["new-model"] }),
                })
            )
        })

        // Check if refresh functions are called on success
        await waitFor(() => {
            expect(mockRefreshFavoriteModelsSilent).toHaveBeenCalled()
            expect(mockRefreshUser).toHaveBeenCalled()
        })
    })

    it("handles update error and shows toast", async () => {
        // Mock update failure
        ; (fetchClient as jest.Mock).mockResolvedValueOnce({
            ok: false,
            statusText: "Server Error",
            json: async () => ({ error: "Failed to update" }),
        })

        const { result } = renderHook(() => useFavoriteModels(), {
            wrapper: createWrapper(),
        })

        result.current.updateFavoriteModels(["new-model"])

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: "Failed to save favorite models",
            }))
        })

        // Should also refresh to sync state
        expect(mockRefreshFavoriteModelsSilent).toHaveBeenCalled()
    })
})
