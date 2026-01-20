
import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { SettingsContent } from "@/app/components/layout/settings/settings-content"

// -----------------------------------------------------------------------------
// Mutable Flags for Mocks
// -----------------------------------------------------------------------------
let mockIsSupabaseEnabled = false
let mockIsDev = false

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

// 1. Config & Utils
jest.mock("@/lib/supabase/config", () => ({
    get isSupabaseEnabled() {
        return mockIsSupabaseEnabled
    },
}))

jest.mock("@/lib/utils", () => ({
    cn: (...inputs: any[]) => inputs.join(" "),
    get isDev() {
        return mockIsDev
    },
}))

// 2. UI Components (Radix/Shadcn)
jest.mock("@/components/ui/tabs", () => {
    const React = require("react")
    const TabsContext = React.createContext({ value: "", onValueChange: (val: any) => { } })

    return {
        Tabs: ({ value, onValueChange, children, className }: any) => (
            <TabsContext.Provider value={{ value, onValueChange }}>
                <div data-testid="tabs" className={className}>
                    {children}
                </div>
            </TabsContext.Provider>
        ),
        TabsList: ({ children, className }: any) => (
            <div data-testid="tabs-list" className={className}>
                {children}
            </div>
        ),
        TabsTrigger: ({ value, children, className }: any) => (
            <TabsContext.Consumer>
                {({ onValueChange }) => (
                    <button
                        data-testid={`tab-trigger-${value}`}
                        className={className}
                        onClick={() => onValueChange(value)}
                    >
                        {children}
                    </button>
                )}
            </TabsContext.Consumer>
        ),
        TabsContent: ({ value, children, className }: any) => (
            <TabsContext.Consumer>
                {({ value: currentValue }) =>
                    currentValue === value ? (
                        <div data-testid={`tab-content-${value}`} className={className}>
                            {children}
                        </div>
                    ) : null
                }
            </TabsContext.Consumer>
        ),
    }
})

jest.mock("@/components/ui/button", () => ({
    Button: ({ children, onClick, variant }: any) => (
        <button data-testid="button" data-variant={variant} onClick={onClick}>
            {children}
        </button>
    ),
}))

jest.mock("@/components/ui/drawer", () => {
    return {
        DrawerClose: ({ children }: any) => <div data-testid="drawer-close">{children}</div>,
    }
})

jest.mock("@phosphor-icons/react", () => {
    return {
        CubeIcon: () => <span data-testid="icon-cube" />,
        GearSixIcon: () => <span data-testid="icon-gear" />,
        KeyIcon: () => <span data-testid="icon-key" />,
        PaintBrushIcon: () => <span data-testid="icon-paint" />,
        PlugsConnectedIcon: () => <span data-testid="icon-plugs" />,
        XIcon: () => <span data-testid="icon-x" />,
    }
})

// 3. Child Components
jest.mock("@/app/components/layout/settings/apikeys/byok-section", () => ({
    ByokSection: () => <div data-testid="byok-section">ByokSection</div>
}))
jest.mock("@/app/components/layout/settings/appearance/interaction-preferences", () => ({
    InteractionPreferences: () => <div data-testid="interaction-preferences">InteractionPreferences</div>
}))
jest.mock("@/app/components/layout/settings/appearance/layout-settings", () => ({
    LayoutSettings: () => <div data-testid="layout-settings">LayoutSettings</div>
}))
jest.mock("@/app/components/layout/settings/appearance/theme-selection", () => ({
    ThemeSelection: () => <div data-testid="theme-selection">ThemeSelection</div>
}))
jest.mock("@/app/components/layout/settings/connections/connections-placeholder", () => ({
    ConnectionsPlaceholder: () => <div data-testid="connections-placeholder">ConnectionsPlaceholder</div>
}))
jest.mock("@/app/components/layout/settings/connections/developer-tools", () => ({
    DeveloperTools: () => <div data-testid="developer-tools">DeveloperTools</div>
}))
jest.mock("@/app/components/layout/settings/connections/ollama-section", () => ({
    OllamaSection: () => <div data-testid="ollama-section">OllamaSection</div>
}))
jest.mock("@/app/components/layout/settings/general/account-management", () => ({
    AccountManagement: () => <div data-testid="account-management">AccountManagement</div>
}))
jest.mock("@/app/components/layout/settings/general/user-profile", () => ({
    UserProfile: () => <div data-testid="user-profile">UserProfile</div>
}))
jest.mock("@/app/components/layout/settings/models/models-settings", () => ({
    ModelsSettings: () => <div data-testid="models-settings">ModelsSettings</div>
}))

describe("SettingsContent", () => {
    beforeEach(() => {
        // Reset flags to default values before each test
        mockIsSupabaseEnabled = false
        mockIsDev = false
        jest.clearAllMocks()
    })

    describe("Desktop Layout (default)", () => {
        it("renders tabs list on the left", () => {
            render(<SettingsContent />)

            expect(screen.getByTestId("tab-trigger-general")).toBeInTheDocument()
            expect(screen.getByTestId("tab-trigger-appearance")).toBeInTheDocument()
            expect(screen.getByTestId("tab-trigger-apikeys")).toBeInTheDocument()
            expect(screen.getByTestId("tab-trigger-models")).toBeInTheDocument()
            expect(screen.getByTestId("tab-trigger-connections")).toBeInTheDocument()

            expect(screen.queryByTestId("drawer-close")).not.toBeInTheDocument()
        })

        it("renders General tab content by default", () => {
            render(<SettingsContent />)
            expect(screen.getByTestId("tab-content-general")).toBeInTheDocument()
            expect(screen.getByTestId("user-profile")).toBeInTheDocument()
        })

        it("switches tabs correctly", () => {
            render(<SettingsContent />)

            // Click Appearance
            fireEvent.click(screen.getByTestId("tab-trigger-appearance"))
            expect(screen.getByTestId("tab-content-appearance")).toBeInTheDocument()
            expect(screen.getByTestId("theme-selection")).toBeInTheDocument()
            expect(screen.queryByTestId("tab-content-general")).not.toBeInTheDocument()

            // Click API Keys
            fireEvent.click(screen.getByTestId("tab-trigger-apikeys"))
            expect(screen.getByTestId("tab-content-apikeys")).toBeInTheDocument()
            expect(screen.getByTestId("byok-section")).toBeInTheDocument()
        })
    })

    describe("Mobile/Drawer Layout", () => {
        it("renders the close button and header", () => {
            render(<SettingsContent isDrawer={true} />)

            expect(screen.getByText("Settings")).toBeInTheDocument()
            expect(screen.getByTestId("drawer-close")).toBeInTheDocument()
        })
    })

    describe("Conditional Rendering: Supabase", () => {
        it("does not render AccountManagement when Supabase is disabled", () => {
            mockIsSupabaseEnabled = false
            render(<SettingsContent />)

            expect(screen.getByTestId("user-profile")).toBeInTheDocument()
            expect(screen.queryByTestId("account-management")).not.toBeInTheDocument()
        })

        it("renders AccountManagement when Supabase is enabled", () => {
            mockIsSupabaseEnabled = true
            render(<SettingsContent />)

            expect(screen.getByTestId("account-management")).toBeInTheDocument()
        })
    })

    describe("Conditional Rendering: Developer Mode", () => {
        it("renders ConnectionsPlaceholder when isDev is false", () => {
            mockIsDev = false
            render(<SettingsContent />)

            // Navigate to connections (click trigger)
            fireEvent.click(screen.getByTestId("tab-trigger-connections"))

            expect(screen.getByTestId("connections-placeholder")).toBeInTheDocument()
            expect(screen.queryByTestId("ollama-section")).not.toBeInTheDocument()
            expect(screen.queryByTestId("developer-tools")).not.toBeInTheDocument()
        })

        it("renders OllamaSection and DeveloperTools when isDev is true", () => {
            mockIsDev = true
            render(<SettingsContent />)

            // Navigate to connections
            fireEvent.click(screen.getByTestId("tab-trigger-connections"))

            expect(screen.queryByTestId("connections-placeholder")).not.toBeInTheDocument()
            expect(screen.getByTestId("ollama-section")).toBeInTheDocument()
            expect(screen.getByTestId("developer-tools")).toBeInTheDocument()
        })
    })
})
