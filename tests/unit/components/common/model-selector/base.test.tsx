/**
 * Unit Tests: ModelSelector Component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModelSelector } from '@/components/common/model-selector/base'

// Mock dependencies
jest.mock('@/lib/model-store/provider', () => ({
    useModel: () => ({
        models: [
            { id: 'gpt-4', name: 'GPT-4', icon: 'openai', accessible: true },
            { id: 'claude-3', name: 'Claude 3', icon: 'anthropic', accessible: false }, // Locked
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
    useBreakpoint: () => false
}))

jest.mock('@/app/hooks/use-key-shortcut', () => ({
    useKeyShortcut: jest.fn()
}))

// Mock sub-menu and pro-dialog to simplify
jest.mock('@/components/common/model-selector/sub-menu', () => ({
    SubMenu: () => <div data-testid="sub-menu">SubMenu</div>
}))
jest.mock('@/components/common/model-selector/pro-dialog', () => ({
    ProModelDialog: ({ isOpen }: any) => isOpen ? <div data-testid="pro-dialog">Pro Dialog</div> : null
}))

describe('ModelSelector Component', () => {
    it('should render selected model', () => {
        render(
            <ModelSelector
                selectedModelId="gpt-4"
                setSelectedModelId={jest.fn()}
            />
        )
        expect(screen.getByText('GPT-4')).toBeInTheDocument()
    })

    it('should open dropdown and show models', async () => {
        const user = userEvent.setup()
        render(
            <ModelSelector
                selectedModelId="gpt-4"
                setSelectedModelId={jest.fn()}
            />
        )

        await user.click(screen.getByText('GPT-4')) // Click trigger

        expect(screen.getByRole('textbox', { name: '' })).toBeInTheDocument() // Search input
        // Check items in dropdown (might need to check if they are visible)
        // Radix dropdown usually renders in a portal, check "GPT-4" and "Claude 3" existence in document
        // Note: duplicate text might exist (one in trigger, one in list)
        expect(screen.getAllByText('GPT-4').length).toBeGreaterThan(1)
        expect(screen.getByText('Claude 3')).toBeInTheDocument()
    })

    it('should show locked badge for inaccessible models', async () => {
        const user = userEvent.setup()
        render(
            <ModelSelector
                selectedModelId="gpt-4"
                setSelectedModelId={jest.fn()}
            />
        )
        await user.click(screen.getByText('GPT-4'))
        expect(screen.getByText('Locked')).toBeInTheDocument()
    })

    it('should call setSelectedModelId on selection', async () => {
        const user = userEvent.setup()
        const setSelectedModelId = jest.fn()
        render(
            <ModelSelector
                selectedModelId="gpt-4"
                setSelectedModelId={setSelectedModelId}
            />
        )

        await user.click(screen.getByText('GPT-4'))
        // Selecting the SAME model might call it or just close.
        // Let's assume we can select it again.
        // Or verify list item click.
        const items = screen.getAllByRole('menuitem')
        // The first one should be GPT-4 (since order depends on map)

        await user.click(items[0])
        expect(setSelectedModelId).toHaveBeenCalledWith('gpt-4')
    })
})
