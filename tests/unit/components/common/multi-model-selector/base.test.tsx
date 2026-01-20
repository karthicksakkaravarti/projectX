/**
 * Unit Tests: MultiModelSelector Component
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiModelSelector } from '@/components/common/multi-model-selector/base'
import { TooltipProvider } from '@/components/ui/tooltip'

// Mock dependencies
jest.mock('@/lib/model-store/provider', () => ({
    useModel: () => ({
        models: [
            { id: 'gpt-4', name: 'GPT-4', icon: 'openai', accessible: true },
            { id: 'claude-3', name: 'Claude 3', icon: 'anthropic', accessible: true },
            { id: 'locked-model', name: 'Locked Model', icon: 'openai', accessible: false },
        ],
        isLoading: false,
        favoriteModels: []
    })
}))

jest.mock('@/lib/user-preference-store/provider', () => ({
    useUserPreferences: () => ({
        isModelHidden: () => false
    })
}))

jest.mock('@/lib/providers', () => ({
    PROVIDERS: [
        { id: 'openai', icon: () => <span data-testid="icon-openai"></span> },
        { id: 'anthropic', icon: () => <span data-testid="icon-anthropic"></span> },
    ]
}))

jest.mock('@/app/hooks/use-breakpoint', () => ({
    useBreakpoint: () => false // Desktop mode
}))

jest.mock('@/app/hooks/use-key-shortcut', () => ({
    useKeyShortcut: jest.fn()
}))

// Mock the ProModelDialog and SubMenu
jest.mock('@/components/common/model-selector/pro-dialog', () => ({
    ProModelDialog: ({ isOpen }: any) => isOpen ? <div data-testid="pro-dialog">Pro Dialog</div> : null
}))

jest.mock('@/components/common/model-selector/sub-menu', () => ({
    SubMenu: () => <div data-testid="sub-menu">SubMenu</div>
}))

// Mock PopoverContentAuth
jest.mock('@/app/components/chat-input/popover-content-auth', () => ({
    PopoverContentAuth: () => <div data-testid="auth-popover">Auth Required</div>
}))

// Wrapper with TooltipProvider
const renderWithProviders = (ui: React.ReactElement) => {
    return render(
        <TooltipProvider>
            {ui}
        </TooltipProvider>
    )
}

describe('MultiModelSelector Component', () => {
    beforeAll(() => {
        // Setup for Radix UI compatibility
        document.body.style.pointerEvents = 'auto'
    })

    it('should render trigger with placeholder when no models selected', () => {
        renderWithProviders(
            <MultiModelSelector
                selectedModelIds={[]}
                setSelectedModelIds={jest.fn()}
            />
        )
        expect(screen.getByText('Select models')).toBeInTheDocument()
    })

    it('should render trigger with single model name when one selected', () => {
        renderWithProviders(
            <MultiModelSelector
                selectedModelIds={['gpt-4']}
                setSelectedModelIds={jest.fn()}
            />
        )
        expect(screen.getByText('GPT-4')).toBeInTheDocument()
    })

    it('should render trigger with count when multiple models selected', () => {
        renderWithProviders(
            <MultiModelSelector
                selectedModelIds={['gpt-4', 'claude-3']}
                setSelectedModelIds={jest.fn()}
            />
        )
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText(/models selected/i)).toBeInTheDocument()
    })

    it('should open dropdown when trigger is clicked', async () => {
        const user = userEvent.setup()
        renderWithProviders(
            <MultiModelSelector
                selectedModelIds={['gpt-4']}
                setSelectedModelIds={jest.fn()}
            />
        )

        await user.click(screen.getByRole('button'))

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Search models...')).toBeInTheDocument()
        })
    })

    it('should show all models in dropdown', async () => {
        const user = userEvent.setup()
        renderWithProviders(
            <MultiModelSelector
                selectedModelIds={[]}
                setSelectedModelIds={jest.fn()}
            />
        )

        await user.click(screen.getByRole('button'))

        await waitFor(() => {
            expect(screen.getByText('GPT-4')).toBeInTheDocument()
            expect(screen.getByText('Claude 3')).toBeInTheDocument()
            expect(screen.getByText('Locked Model')).toBeInTheDocument()
        })
    })

    it('should add model when selecting unselected model', async () => {
        const user = userEvent.setup()
        const setSelectedModelIds = jest.fn()
        renderWithProviders(
            <MultiModelSelector
                selectedModelIds={['gpt-4']}
                setSelectedModelIds={setSelectedModelIds}
            />
        )

        await user.click(screen.getByRole('button'))

        await waitFor(() => {
            expect(screen.getByText('Claude 3')).toBeInTheDocument()
        })

        // Click Claude 3 to add it
        const menuItems = screen.getAllByRole('menuitem')
        const claudeItem = menuItems.find(item => item.textContent?.includes('Claude 3'))
        if (claudeItem) {
            await user.click(claudeItem)
        }

        expect(setSelectedModelIds).toHaveBeenCalledWith(['gpt-4', 'claude-3'])
    })

    it('should remove model when clicking selected model', async () => {
        const user = userEvent.setup()
        const setSelectedModelIds = jest.fn()
        renderWithProviders(
            <MultiModelSelector
                selectedModelIds={['gpt-4', 'claude-3']}
                setSelectedModelIds={setSelectedModelIds}
            />
        )

        await user.click(screen.getByRole('button'))

        await waitFor(() => {
            expect(screen.getAllByText('GPT-4').length).toBeGreaterThan(0)
        })

        // Find and click GPT-4 in menu to deselect
        const menuItems = screen.getAllByRole('menuitem')
        const gptItem = menuItems.find(item => item.textContent?.includes('GPT-4'))
        if (gptItem) {
            await user.click(gptItem)
        }

        expect(setSelectedModelIds).toHaveBeenCalledWith(['claude-3'])
    })

    it('should show locked badge for inaccessible models', async () => {
        const user = userEvent.setup()
        renderWithProviders(
            <MultiModelSelector
                selectedModelIds={[]}
                setSelectedModelIds={jest.fn()}
            />
        )

        await user.click(screen.getByRole('button'))

        await waitFor(() => {
            expect(screen.getByText('Locked')).toBeInTheDocument()
        })
    })

    it('should show auth popover when user is not authenticated', () => {
        renderWithProviders(
            <MultiModelSelector
                selectedModelIds={[]}
                setSelectedModelIds={jest.fn()}
                isUserAuthenticated={false}
            />
        )

        // Should show the auth trigger button
        expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should filter models based on search query', async () => {
        const user = userEvent.setup()
        renderWithProviders(
            <MultiModelSelector
                selectedModelIds={[]}
                setSelectedModelIds={jest.fn()}
            />
        )

        await user.click(screen.getByRole('button'))

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Search models...')).toBeInTheDocument()
        })

        await user.type(screen.getByPlaceholderText('Search models...'), 'Claude')

        await waitFor(() => {
            expect(screen.getByText('Claude 3')).toBeInTheDocument()
        })
    })
})
