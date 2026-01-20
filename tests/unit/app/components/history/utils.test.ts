import { groupChatsByDate, formatDate } from "@/app/components/history/utils"
import type { Chats } from "@/lib/chat-store/types"

describe("History Utils", () => {
    describe("groupChatsByDate", () => {
        const mockChats: Partial<Chats>[] = [
            { id: "1", title: "Today Chat", updated_at: new Date().toISOString() },
            { id: "2", title: "Yesterday Chat", updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
            { id: "3", title: "Last Week Chat", updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
            { id: "4", title: "This Year Chat", updated_at: new Date(new Date().getFullYear(), 0, 15).toISOString() },
            { id: "5", title: "Old Chat", updated_at: "2023-01-01T00:00:00Z" },
        ]

        it("should return null if search query is provided", () => {
            expect(groupChatsByDate(mockChats as Chats[], "search")).toBeNull()
        })

        it("should group chats correctly by date", () => {
            const groups = groupChatsByDate(mockChats as Chats[], "")
            expect(groups).not.toBeNull()
            expect(groups?.length).toBeGreaterThan(0)

            const groupNames = groups?.map(g => g.name)
            expect(groupNames).toContain("Today")
            expect(groupNames).toContain("Last 7 days")
        })

        it("should skip pinned chats and chats with project_id", () => {
            const chats: Partial<Chats>[] = [
                { id: "1", title: "Normal", updated_at: new Date().toISOString() },
                { id: "2", title: "Pinned", pinned: true, updated_at: new Date().toISOString() },
                { id: "3", title: "Project", project_id: "p1", updated_at: new Date().toISOString() },
            ]
            const groups = groupChatsByDate(chats as Chats[], "")
            expect(groups?.[0].chats).toHaveLength(1)
            expect(groups?.[0].chats[0].title).toBe("Normal")
        })
    })

    describe("formatDate", () => {
        it("should return 'No date' if dateString is missing", () => {
            expect(formatDate(null)).toBe("No date")
        })

        it("should format recent dates correctly", () => {
            const now = new Date().toISOString()
            expect(formatDate(now)).toBe("Just now")

            const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
            expect(formatDate(hourAgo)).toBe("1 hour ago")

            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            expect(formatDate(dayAgo)).toBe("1 day ago")
        })

        it("should format older dates with full month names", () => {
            const oldDate = "2023-05-15T00:00:00Z"
            expect(formatDate(oldDate)).toContain("May 15")
            expect(formatDate(oldDate)).toContain("2023")
        })
    })
})
