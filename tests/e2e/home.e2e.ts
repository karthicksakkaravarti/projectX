/**
 * E2E Tests: Home Page
 */

import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
    })

    test('should load the home page successfully', async ({ page }) => {
        // Wait for the page to load
        await expect(page).toHaveTitle(/ProjectX/i)
    })

    test('should display the main heading', async ({ page }) => {
        // Look for app branding or main heading
        const heading = page.locator('h1, [role="heading"]').first()
        await expect(heading).toBeVisible()
    })

    test('should have a chat input area', async ({ page }) => {
        // Look for textarea or input for chat
        const chatInput = page.locator('textarea, input[type="text"]').first()
        await expect(chatInput).toBeVisible()
    })

    test('should be responsive on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 })

        // Page should still be functional
        await expect(page.locator('body')).toBeVisible()
    })

    test('should have proper SEO meta tags', async ({ page }) => {
        // Check for meta description
        const metaDescription = page.locator('meta[name="description"]')
        await expect(metaDescription).toHaveCount(1)

        // Check for viewport meta
        const viewport = page.locator('meta[name="viewport"]')
        await expect(viewport).toHaveCount(1)
    })
})

test.describe('Theme', () => {
    test('should support dark mode', async ({ page }) => {
        await page.goto('/')

        // Check if dark mode is supported (html or body should have dark class or data attribute)
        const html = page.locator('html')
        const isDark = await html.getAttribute('class')
        const dataTheme = await html.getAttribute('data-theme')

        // Either the class or data-theme should indicate theme support
        expect(isDark !== null || dataTheme !== null).toBe(true)
    })
})

test.describe('Navigation', () => {
    test('should navigate without errors', async ({ page }) => {
        await page.goto('/')

        // Check for console errors
        const errors: string[] = []
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text())
            }
        })

        // Wait for hydration
        await page.waitForTimeout(1000)

        // Filter out known acceptable errors
        const criticalErrors = errors.filter(
            (e) => !e.includes('favicon') && !e.includes('404')
        )

        expect(criticalErrors).toHaveLength(0)
    })
})

test.describe('Accessibility', () => {
    test('should have no critical accessibility issues', async ({ page }) => {
        await page.goto('/')

        // Check for skip link or main landmark
        const main = page.locator('main, [role="main"]')
        await expect(main).toBeVisible()
    })

    test('should be keyboard navigable', async ({ page }) => {
        await page.goto('/')

        // Tab through the page
        await page.keyboard.press('Tab')

        // Something should be focused
        const focusedElement = page.locator(':focus')
        await expect(focusedElement).toBeVisible()
    })
})
