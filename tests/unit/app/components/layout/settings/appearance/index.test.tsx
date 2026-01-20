import { ThemeSelection, LayoutSettings, InteractionPreferences } from "@/app/components/layout/settings/appearance"

describe("Appearance Settings Index", () => {
    it("exports ThemeSelection", () => {
        expect(ThemeSelection).toBeDefined()
    })

    it("exports LayoutSettings", () => {
        expect(LayoutSettings).toBeDefined()
    })

    it("exports InteractionPreferences", () => {
        expect(InteractionPreferences).toBeDefined()
    })
})
