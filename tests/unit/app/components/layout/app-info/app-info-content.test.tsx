import { render, screen } from "@testing-library/react"
import { AppInfoContent } from "@/app/components/layout/app-info/app-info-content"

describe("AppInfoContent", () => {
    it("renders the app information", () => {
        render(<AppInfoContent />)
        expect(screen.getByText(/ProjectX/i)).toBeInTheDocument()
        expect(screen.getByText(/open-source interface/i)).toBeInTheDocument()
        expect(screen.getByText(/Multi-model/i)).toBeInTheDocument()
    })
})
