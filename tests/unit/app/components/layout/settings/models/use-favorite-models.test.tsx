import { renderHook, waitFor } from "@testing-library/react"
import { useFavoriteModels } from "@/app/components/layout/settings/models/use-favorite-models"
import { fetchClient } from "@/lib/fetch"
import { useModel } from "@/lib/model-store/provider"
import { useUser } from "@/lib/user-store/provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode } from "react"
import { toast } from "@/components/ui/toast"

// Mock dependencies
jest.mock("@/lib/fetch", () => ({
    fetchClient: jest.fn(),
}))

jest.mock("@/lib/model-store/provider", () => ({
    useModel: jest.fn(),
}))

jest.mock("@/lib/user-store/provider", () => ({
    useUser: jest.fn(),
}))

jest.mock("@/components/ui/toast", () => ({
    toast: jest.fn(),
}))

jest.mock("@/lib/utils", () => ({
    debounce: (fn: Function) => fn,
}))

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}

describe("useFavoriteModels", () => {
    const mockRefreshFavoriteModelsSilent = jest.fn()
    const mockRefreshUser = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()

            ; (useModel as jest.Mock).mockReturnValue({
                favoriteModels: ["gpt-4"],
                refreshFavoriteModelsSilent: mockRefreshFavoriteModelsSilent,
            })

            ; (useUser as jest.Mock).mockReturnValue({
                refreshUser: mockRefreshUser,
            })
    })

    it("should return initial favorite models from useModel", () => {
        const { result } = renderHook(() => useFavoriteModels(), {
            wrapper: createWrapper(),
        })

        expect(result.current.favoriteModels).toEqual(["gpt-4"])
    })

    it("should update favorite models", async () => {
        ; (fetchClient as jest.Mock).mockResolvedValue({
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
                    body: JSON.stringify({ favorite_models: ["new-model"] })
                })
            )
        })
    })

    it("should call refresh functions on success", async () => {
        ; (fetchClient as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        })

        const { result } = renderHook(() => useFavoriteModels(), {
            wrapper: createWrapper(),
        })

        result.current.updateFavoriteModels(["new-model"])

        await waitFor(() => {
            expect(mockRefreshFavoriteModelsSilent).toHaveBeenCalled()
            expect(mockRefreshUser).toHaveBeenCalled()
        })
    })

    it("should handle update error and toast", async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

            ; (fetchClient as jest.Mock).mockResolvedValue({
                ok: false,
                json: async () => ({ error: "Some error" }),
                statusText: "Bad Request"
            })

        const { result } = renderHook(() => useFavoriteModels(), {
            wrapper: createWrapper(),
        })

        result.current.updateFavoriteModels(["fail-model"])

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: "Failed to save favorite models",
                description: "Some error"
            }))
        })

        consoleSpy.mockRestore()
    })

    it("should use debounced update when requested", async () => {
        ; (fetchClient as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        })

        const { result } = renderHook(() => useFavoriteModels(), {
            wrapper: createWrapper(),
        })

        result.current.updateFavoriteModelsDebounced(["debounce-model"])

        await waitFor(() => {
            expect(fetchClient).toHaveBeenCalledWith(
                "/api/user-preferences/favorite-models",
                expect.anything()
            )
        })
    })
})
