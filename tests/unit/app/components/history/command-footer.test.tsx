import { render, screen } from "@testing-library/react"
import { CommandFooter } from "@/app/components/history/command-footer"

describe("CommandFooter", () => {
    it("should render navigation shortcuts", () => {
        render(<CommandFooter />)
        expect(screen.getByText("Navigate")).toBeInTheDocument()
        expect(screen.getByText("Go to chat")).toBeInTheDocument()
        expect(screen.getByText("Toggle")).toBeInTheDocument()
        expect(screen.getByText("Close")).toBeInTheDocument()
    })

    it("should display control keys", () => {
        render(<CommandFooter />)
        expect(screen.getByText("↑")).toBeInTheDocument()
        expect(screen.getByText("↓")).toBeInTheDocument()
        expect(screen.getByText("⏎")).toBeInTheDocument()
        expect(screen.getByText("⌘")).toBeInTheDocument()
        expect(screen.getByText("K")).toBeInTheDocument()
        expect(screen.getByText("Esc")).toBeInTheDocument()
    })
})
