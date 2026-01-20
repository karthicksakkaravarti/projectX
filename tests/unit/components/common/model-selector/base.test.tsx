/**
 * Unit Tests: ModelSelector Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ModelSelector } from '@/components/common/model-selector/base'

// Mock all UI components to avoid Radix issues
jest.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
    DropdownMenuTrigger: ({ children, asChild }: any) => <div data-testid="dropdown-trigger">{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, onSelect }: any) => (
        <div role="menuitem" onClick={onSelect}>{children}</div>
    ),
}))

jest.mock('@/components/ui/tooltip', () => ({
    Tooltip: ({ children }: any) => <>{children}</>,
    TooltipTrigger: ({ children }: any) => <>{children}</>,
    TooltipContent: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/drawer', () => ({
    Drawer: ({ children }: any) => <div>{children}</div>,
    DrawerTrigger: ({ children }: any) => <div>{children}</div>,
    DrawerContent: ({ children }: any) => <div>{children}</div>,
    DrawerHeader: ({ children }: any) => <div>{children}</div>,
    DrawerTitle: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/popover', () => ({
    Popover: ({ children }: any) => <div>{children}</div>,
    PopoverTrigger: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/app/components/chat-input/popover-content-auth', () => ({
    PopoverContentAuth: () => null,
}))

jest.mock('@/lib/model-store/provider', () => ({
    useModel: () => ({
        models: [
            { id: 'gpt-4', name: 'GPT-4', icon: 'openai', accessible: true },
            { id: 'claude-3', name: 'Claude 3', icon: 'anthropic', accessible: false },
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

jest.mock('@/lib/model-store/utils', () => ({
    filterAndSortModels: (models: any[]) => models,
}))

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
        // Use getAllByText since model name may appear in trigger and dropdown
        const gpt4Elements = screen.getAllByText('GPT-4')
        expect(gpt4Elements.length).toBeGreaterThan(0)
    })

    it('should render dropdown menu structure', () => {
        render(
            <ModelSelector
                selectedModelId="gpt-4"
                setSelectedModelId={jest.fn()}
            />
        )
        expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
        expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument()
    })

    it('should render model items', () => {
        render(
            <ModelSelector
                selectedModelId="gpt-4"
                setSelectedModelId={jest.fn()}
            />
        )
        
        // Both models should be rendered in dropdown content
        const gpt4Elements = screen.getAllByText('GPT-4')
        expect(gpt4Elements.length).toBeGreaterThan(0)
        expect(screen.getByText('Claude 3')).toBeInTheDocument()
    })

    it('should show Locked text for inaccessible models', () => {
        render(
            <ModelSelector
                selectedModelId="gpt-4"
                setSelectedModelId={jest.fn()}
            />
        )
        expect(screen.getByText('Locked')).toBeInTheDocument()
    })
})
