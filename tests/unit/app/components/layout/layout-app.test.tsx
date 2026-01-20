import { render, screen } from "@testing-library/react"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { useUserPreferences } from "@/lib/user-preference-store/provider"

// Mock hooks
jest.mock("@/lib/user-preference-store/provider")

// Mock child components
jest.mock("@/app/components/layout/header", () => ({
    Header: ({ hasSidebar }: { hasSidebar: boolean }) => (
        <div data-testid="header">Header {hasSidebar ? "with sidebar" : "without sidebar"}</div>
    ),
}))
jest.mock("@/app/components/layout/sidebar/app-sidebar", () => ({
    AppSidebar: () => <div data-testid="sidebar">AppSidebar</div>,
}))

describe("LayoutApp", () => {
    beforeEach(() => {
        ; (useUserPreferences as jest.Mock).mockReturnValue({
            preferences: { layout: "center" },
        })
    })

    it("renders children and header without sidebar when layout is 'center'", () => {
        render(
            <LayoutApp>
                <div data-testid="child">Child Content</div>
            </LayoutApp>
        )

        expect(screen.getByTestId("child")).toBeInTheDocument()
        expect(screen.getByTestId("header")).toHaveTextContent("Header without sidebar")
        expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument()
    })

    it("renders sidebar and header with sidebar when layout is 'sidebar'", () => {
        ; (useUserPreferences as jest.Mock).mockReturnValue({
            preferences: { layout: "sidebar" },
        })

        render(
            <LayoutApp>
                <div data-testid="child">Child Content</div>
            </LayoutApp>
        )

        expect(screen.getByTestId("child")).toBeInTheDocument()
        expect(screen.getByTestId("header")).toHaveTextContent("Header with sidebar")
        expect(screen.getByTestId("sidebar")).toBeInTheDocument()
    })
})
