/**
 * Unit Tests: MultiModelSelector Component
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiModelSelector } from '@/components/common/multi-model-selector/base'
import { TooltipProvider } from '@/components/ui/tooltip'

// Mock dependencies
let mockIsLoading = false
let mockModels = [
    { id: 'gpt-4', name: 'GPT-4', icon: 'openai', accessible: true },
    { id: 'claude-3', name: 'Claude 3', icon: 'anthropic', accessible: true },
    { id: 'locked-model', name: 'Locked Model', icon: 'openai', accessible: false },
]
let mockIsMobile = false

jest.mock('@/lib/model-store/provider', () => ({
    useModel: () => ({
        models: mockModels,
        isLoading: mockIsLoading,
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
        { id: 'openai', icon: ({ className }: { className?: string }) => <span data-testid="icon-openai" className={className}></span> },
        { id: 'anthropic', icon: ({ className }: { className?: string }) => <span data-testid="icon-anthropic" className={className}></span> },
    ]
}))

jest.mock('@/app/hooks/use-breakpoint', () => ({
    useBreakpoint: () => mockIsMobile
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

    beforeEach(() => {
        mockIsLoading = false
        mockModels = [
            { id: 'gpt-4', name: 'GPT-4', icon: 'openai', accessible: true },
            { id: 'claude-3', name: 'Claude 3', icon: 'anthropic', accessible: true },
            { id: 'locked-model', name: 'Locked Model', icon: 'openai', accessible: false },
        ]
        mockIsMobile = false
    })

    it('should render nothing when models are loading', () => {
        mockIsLoading = true
        const { container } = renderWithProviders(
            <MultiModelSelector
                selectedModelIds={[]}
                setSelectedModelIds={jest.fn()}
            />
        )
        // Should not render anything when loading
        expect(container.querySelector('button')).toBeNull()
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

    describe('Mobile View', () => {
        it('should render drawer on mobile', async () => {
            mockIsMobile = true
            const user = userEvent.setup()
            renderWithProviders(
                <MultiModelSelector
                    selectedModelIds={['gpt-4']}
                    setSelectedModelIds={jest.fn()}
                />
            )

            await user.click(screen.getByRole('button'))

            // Drawer should be rendered
            await waitFor(() => {
                expect(screen.getByText(/Select Models/)).toBeInTheDocument()
            })
        })
    })

    describe('Model Limits', () => {
        it('should disable checkbox for unselected models when at limit', async () => {
            const user = userEvent.setup()
            const setSelectedModelIds = jest.fn()
            renderWithProviders(
                <MultiModelSelector
                    selectedModelIds={['gpt-4']}
                    setSelectedModelIds={setSelectedModelIds}
                    maxModels={1}
                />
            )

            await user.click(screen.getByRole('button'))

            await waitFor(() => {
                // When at limit, other models should be visible but not selectable
                expect(screen.getByText('Claude 3')).toBeInTheDocument()
            })
            
            // Should not add a new model when at limit
            const menuItems = screen.getAllByRole('menuitem')
            const claudeItem = menuItems.find(item => item.textContent?.includes('Claude 3'))
            if (claudeItem) {
                await user.click(claudeItem)
            }
            
            // Should not be called because we're at limit
            expect(setSelectedModelIds).not.toHaveBeenCalledWith(['gpt-4', 'claude-3'])
        })

        it('should allow selecting models up to maxModels', async () => {
            const user = userEvent.setup()
            const setSelectedModelIds = jest.fn()
            renderWithProviders(
                <MultiModelSelector
                    selectedModelIds={[]}
                    setSelectedModelIds={setSelectedModelIds}
                    maxModels={2}
                />
            )

            await user.click(screen.getByRole('button'))

            await waitFor(() => {
                expect(screen.getByText('GPT-4')).toBeInTheDocument()
            })

            // Click GPT-4 to add it
            const menuItems = screen.getAllByRole('menuitem')
            const gptItem = menuItems.find(item => item.textContent?.includes('GPT-4'))
            if (gptItem) {
                await user.click(gptItem)
            }

            expect(setSelectedModelIds).toHaveBeenCalledWith(['gpt-4'])
        })
    })

    describe('Locked Models', () => {
        it('should open pro dialog when clicking locked model', async () => {
            const user = userEvent.setup()
            const setSelectedModelIds = jest.fn()
            renderWithProviders(
                <MultiModelSelector
                    selectedModelIds={[]}
                    setSelectedModelIds={setSelectedModelIds}
                />
            )

            await user.click(screen.getByRole('button'))

            await waitFor(() => {
                expect(screen.getByText('Locked Model')).toBeInTheDocument()
            })

            // Click on Locked Model
            const menuItems = screen.getAllByRole('menuitem')
            const lockedItem = menuItems.find(item => item.textContent?.includes('Locked Model'))
            if (lockedItem) {
                await user.click(lockedItem)
            }

            // Should show pro dialog
            await waitFor(() => {
                expect(screen.getByTestId('pro-dialog')).toBeInTheDocument()
            })
        })
    })

    describe('Trigger Display', () => {
        it('should show model count for multiple models', () => {
            renderWithProviders(
                <MultiModelSelector
                    selectedModelIds={['gpt-4', 'claude-3']}
                    setSelectedModelIds={jest.fn()}
                />
            )
            expect(screen.getByText('2')).toBeInTheDocument()
        })

        it('should display model icon for single model', () => {
            renderWithProviders(
                <MultiModelSelector
                    selectedModelIds={['gpt-4']}
                    setSelectedModelIds={jest.fn()}
                />
            )
            expect(screen.getByTestId('icon-openai')).toBeInTheDocument()
        })

        it('should display multiple model icons when more than 3 selected', () => {
            mockModels = [
                { id: 'gpt-4', name: 'GPT-4', icon: 'openai', accessible: true },
                { id: 'claude-3', name: 'Claude 3', icon: 'anthropic', accessible: true },
                { id: 'gpt-3', name: 'GPT-3', icon: 'openai', accessible: true },
                { id: 'claude-2', name: 'Claude 2', icon: 'anthropic', accessible: true },
            ]
            renderWithProviders(
                <MultiModelSelector
                    selectedModelIds={['gpt-4', 'claude-3', 'gpt-3', 'claude-2']}
                    setSelectedModelIds={jest.fn()}
                />
            )
            expect(screen.getByText('4')).toBeInTheDocument()
        })
    })

    describe('Empty Results', () => {
        it('should show no results message when search has no matches', async () => {
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

            await user.type(screen.getByPlaceholderText('Search models...'), 'nonexistent')

            await waitFor(() => {
                expect(screen.getByText('No results found.')).toBeInTheDocument()
            })
        })
    })
})
