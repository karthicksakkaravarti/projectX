/**
 * API Tests: Rate Limits
 */

describe('Rate Limits API', () => {
    const baseUrl = 'http://localhost:3000/api'

    describe('GET /api/rate-limits', () => {
        it('should return rate limit info for authenticated user', async () => {
            const response = await fetch(
                `${baseUrl}/rate-limits?userId=test-user&isAuthenticated=true`
            )
            const data = await response.json()

            expect(response.ok).toBe(true)
            expect(data).toHaveProperty('remaining')
            expect(data).toHaveProperty('limit')
        })

        it('should return rate limit info for guest user', async () => {
            const response = await fetch(
                `${baseUrl}/rate-limits?userId=guest-user&isAuthenticated=false`
            )
            const data = await response.json()

            expect(response.ok).toBe(true)
            expect(data).toHaveProperty('remaining')
            expect(data).toHaveProperty('limit')
        })

        it('should return lower limits for guest users', async () => {
            const guestResponse = await fetch(
                `${baseUrl}/rate-limits?userId=guest&isAuthenticated=false`
            )
            const guestData = await guestResponse.json()

            const authResponse = await fetch(
                `${baseUrl}/rate-limits?userId=auth&isAuthenticated=true`
            )
            const authData = await authResponse.json()

            expect(guestData.limit).toBeLessThan(authData.limit)
        })
    })
})
