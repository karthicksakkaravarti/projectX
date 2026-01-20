import { render, screen } from "@testing-library/react"
import { ConnectionsPlaceholder } from "@/app/components/layout/settings/connections/connections-placeholder"

describe("ConnectionsPlaceholder", () => {
    it("renders the placeholder content correctly", () => {
        render(<ConnectionsPlaceholder />)

        // Check for the icon (by checking if the SVG is present or by a testid if we had one, 
        // but here we can check for the text which implies the component rendered)
        expect(screen.getByText("No developer tools available")).toBeInTheDocument()
        expect(
            screen.getByText(
                "Third-party service connections will appear here in development mode."
            )
        ).toBeInTheDocument()
    })
})
