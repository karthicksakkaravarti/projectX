/**
 * Unit Tests: Sidebar Component
 */

import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarProvider,
    SidebarTrigger,
    SidebarRail,
    SidebarInset,
    SidebarInput,
    SidebarSeparator,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuAction,
    SidebarMenuBadge,
    SidebarMenuSkeleton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    useSidebar,
} from '@/components/ui/sidebar'

// Mock use-mobile hook - default to desktop
const mockUseIsMobile = jest.fn(() => false)
jest.mock('@/app/hooks/use-mobile', () => ({
    useIsMobile: () => mockUseIsMobile(),
}))

// Test component that uses useSidebar hook
const SidebarConsumer = () => {
    const { state, open, toggleSidebar, openMobile, isMobile } = useSidebar()
    return (
        <div>
            <span data-testid="state">{state}</span>
            <span data-testid="open">{String(open)}</span>
            <span data-testid="open-mobile">{String(openMobile)}</span>
            <span data-testid="is-mobile">{String(isMobile)}</span>
            <button data-testid="toggle" onClick={toggleSidebar}>Toggle</button>
        </div>
    )
}

describe('Sidebar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseIsMobile.mockReturnValue(false)
        // Clear document cookies
        document.cookie = ''
    })

    describe('SidebarProvider', () => {
        it('should render sidebar structure', () => {
            render(
                <SidebarProvider>
                    <Sidebar>
                        <SidebarHeader>Header</SidebarHeader>
                        <SidebarContent>Content</SidebarContent>
                        <SidebarFooter>Footer</SidebarFooter>
                    </Sidebar>
                </SidebarProvider>
            )

            expect(screen.getByText('Header')).toBeInTheDocument()
            expect(screen.getByText('Content')).toBeInTheDocument()
            expect(screen.getByText('Footer')).toBeInTheDocument()
        })

        it('should default to expanded state', () => {
            render(
                <SidebarProvider>
                    <SidebarConsumer />
                </SidebarProvider>
            )
            
            expect(screen.getByTestId('state')).toHaveTextContent('expanded')
            expect(screen.getByTestId('open')).toHaveTextContent('true')
        })

        it('should respect defaultOpen prop', () => {
            render(
                <SidebarProvider defaultOpen={false}>
                    <SidebarConsumer />
                </SidebarProvider>
            )
            
            expect(screen.getByTestId('state')).toHaveTextContent('collapsed')
            expect(screen.getByTestId('open')).toHaveTextContent('false')
        })

        it('should be controlled when open prop is provided', () => {
            const onOpenChange = jest.fn()
            render(
                <SidebarProvider open={true} onOpenChange={onOpenChange}>
                    <SidebarConsumer />
                </SidebarProvider>
            )
            
            fireEvent.click(screen.getByTestId('toggle'))
            expect(onOpenChange).toHaveBeenCalledWith(false)
        })

        it('should toggle sidebar on desktop', () => {
            render(
                <SidebarProvider>
                    <SidebarConsumer />
                </SidebarProvider>
            )
            
            expect(screen.getByTestId('open')).toHaveTextContent('true')
            fireEvent.click(screen.getByTestId('toggle'))
            expect(screen.getByTestId('open')).toHaveTextContent('false')
        })

        it('should toggle mobile sidebar on mobile', () => {
            mockUseIsMobile.mockReturnValue(true)
            render(
                <SidebarProvider>
                    <SidebarConsumer />
                </SidebarProvider>
            )
            
            expect(screen.getByTestId('open-mobile')).toHaveTextContent('false')
            fireEvent.click(screen.getByTestId('toggle'))
            expect(screen.getByTestId('open-mobile')).toHaveTextContent('true')
        })

        it('should handle keyboard shortcut Ctrl+B', () => {
            render(
                <SidebarProvider>
                    <SidebarConsumer />
                </SidebarProvider>
            )
            
            expect(screen.getByTestId('open')).toHaveTextContent('true')
            
            act(() => {
                fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
            })
            
            expect(screen.getByTestId('open')).toHaveTextContent('false')
        })

        it('should handle keyboard shortcut Meta+B (Mac)', () => {
            render(
                <SidebarProvider>
                    <SidebarConsumer />
                </SidebarProvider>
            )
            
            expect(screen.getByTestId('open')).toHaveTextContent('true')
            
            act(() => {
                fireEvent.keyDown(window, { key: 'b', metaKey: true })
            })
            
            expect(screen.getByTestId('open')).toHaveTextContent('false')
        })

        it('should set cookie when state changes', () => {
            render(
                <SidebarProvider>
                    <SidebarConsumer />
                </SidebarProvider>
            )
            
            fireEvent.click(screen.getByTestId('toggle'))
            expect(document.cookie).toContain('sidebar_state=false')
        })
    })

    describe('useSidebar hook', () => {
        it('should throw error when used outside SidebarProvider', () => {
            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            
            expect(() => {
                render(<SidebarConsumer />)
            }).toThrow('useSidebar must be used within a SidebarProvider.')
            
            consoleSpy.mockRestore()
        })
    })

    describe('SidebarTrigger', () => {
        it('should render sidebar trigger', () => {
            render(
                <SidebarProvider>
                    <SidebarTrigger />
                </SidebarProvider>
            )
            expect(screen.getByRole('button', { name: 'Toggle Sidebar' })).toBeInTheDocument()
        })

        it('should toggle sidebar when clicked', () => {
            render(
                <SidebarProvider>
                    <SidebarConsumer />
                    <SidebarTrigger />
                </SidebarProvider>
            )
            
            expect(screen.getByTestId('open')).toHaveTextContent('true')
            fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))
            expect(screen.getByTestId('open')).toHaveTextContent('false')
        })

        it('should call custom onClick handler', () => {
            const onClick = jest.fn()
            render(
                <SidebarProvider>
                    <SidebarTrigger onClick={onClick} />
                </SidebarProvider>
            )
            
            fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))
            expect(onClick).toHaveBeenCalled()
        })
    })

    describe('Sidebar variants', () => {
        it('should render with collapsible="none"', () => {
            render(
                <SidebarProvider>
                    <Sidebar collapsible="none">
                        <SidebarContent>Content</SidebarContent>
                    </Sidebar>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Content')).toBeInTheDocument()
        })

        it('should render with side="right"', () => {
            render(
                <SidebarProvider>
                    <Sidebar side="right">
                        <SidebarContent>Content</SidebarContent>
                    </Sidebar>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Content')).toBeInTheDocument()
        })

        it('should render with variant="floating"', () => {
            render(
                <SidebarProvider>
                    <Sidebar variant="floating">
                        <SidebarContent>Content</SidebarContent>
                    </Sidebar>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Content')).toBeInTheDocument()
        })

        it('should render with variant="inset"', () => {
            render(
                <SidebarProvider>
                    <Sidebar variant="inset">
                        <SidebarContent>Content</SidebarContent>
                    </Sidebar>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Content')).toBeInTheDocument()
        })

        it('should render mobile sidebar as Sheet on mobile', () => {
            mockUseIsMobile.mockReturnValue(true)
            render(
                <SidebarProvider>
                    <Sidebar>
                        <SidebarContent>Mobile Content</SidebarContent>
                    </Sidebar>
                </SidebarProvider>
            )
            
            // Sheet should be rendered for mobile
            expect(screen.queryByText('Mobile Content')).not.toBeInTheDocument()
        })
    })

    describe('SidebarRail', () => {
        it('should render rail button', () => {
            render(
                <SidebarProvider>
                    <Sidebar>
                        <SidebarRail />
                    </Sidebar>
                </SidebarProvider>
            )
            
            expect(screen.getByRole('button', { name: 'Toggle Sidebar' })).toBeInTheDocument()
        })

        it('should toggle sidebar when rail is clicked', () => {
            render(
                <SidebarProvider>
                    <SidebarConsumer />
                    <Sidebar>
                        <SidebarRail />
                    </Sidebar>
                </SidebarProvider>
            )
            
            expect(screen.getByTestId('open')).toHaveTextContent('true')
            fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))
            expect(screen.getByTestId('open')).toHaveTextContent('false')
        })
    })

    describe('SidebarInset', () => {
        it('should render main content area', () => {
            render(
                <SidebarProvider>
                    <SidebarInset>Main Content</SidebarInset>
                </SidebarProvider>
            )
            
            expect(screen.getByRole('main')).toHaveTextContent('Main Content')
        })
    })

    describe('SidebarInput', () => {
        it('should render input field', () => {
            render(
                <SidebarProvider>
                    <SidebarInput placeholder="Search..." />
                </SidebarProvider>
            )
            
            expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
        })
    })

    describe('SidebarSeparator', () => {
        it('should render separator', () => {
            render(
                <SidebarProvider>
                    <SidebarSeparator />
                </SidebarProvider>
            )
            
            expect(document.querySelector('[data-sidebar="separator"]')).toBeInTheDocument()
        })
    })

    describe('SidebarGroup', () => {
        it('should render group with label and content', () => {
            render(
                <SidebarProvider>
                    <SidebarGroup>
                        <SidebarGroupLabel>Group Label</SidebarGroupLabel>
                        <SidebarGroupContent>Group Content</SidebarGroupContent>
                    </SidebarGroup>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Group Label')).toBeInTheDocument()
            expect(screen.getByText('Group Content')).toBeInTheDocument()
        })

        it('should render group label as child', () => {
            render(
                <SidebarProvider>
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <span>Custom Label</span>
                        </SidebarGroupLabel>
                    </SidebarGroup>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Custom Label')).toBeInTheDocument()
        })

        it('should render group action', () => {
            const onClick = jest.fn()
            render(
                <SidebarProvider>
                    <SidebarGroup>
                        <SidebarGroupAction onClick={onClick}>Action</SidebarGroupAction>
                    </SidebarGroup>
                </SidebarProvider>
            )
            
            fireEvent.click(screen.getByText('Action'))
            expect(onClick).toHaveBeenCalled()
        })

        it('should render group action as child', () => {
            render(
                <SidebarProvider>
                    <SidebarGroup>
                        <SidebarGroupAction asChild>
                            <button>Custom Action</button>
                        </SidebarGroupAction>
                    </SidebarGroup>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Custom Action')).toBeInTheDocument()
        })
    })

    describe('SidebarMenu', () => {
        it('should render menu with items', () => {
            render(
                <SidebarProvider>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton>Menu Item</SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Menu Item')).toBeInTheDocument()
        })

        it('should render menu button with tooltip', () => {
            render(
                <SidebarProvider>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Tooltip text">Button</SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Button')).toBeInTheDocument()
        })

        it('should render menu button with tooltip object', () => {
            render(
                <SidebarProvider>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip={{ children: 'Complex Tooltip' }}>Button</SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Button')).toBeInTheDocument()
        })

        it('should render active menu button', () => {
            render(
                <SidebarProvider>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton isActive>Active Item</SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Active Item')).toHaveAttribute('data-active', 'true')
        })

        it('should render menu button with different variants', () => {
            render(
                <SidebarProvider>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton variant="outline">Outline</SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Outline')).toBeInTheDocument()
        })

        it('should render menu button with different sizes', () => {
            render(
                <SidebarProvider>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="sm">Small</SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg">Large</SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Small')).toHaveAttribute('data-size', 'sm')
            expect(screen.getByText('Large')).toHaveAttribute('data-size', 'lg')
        })

        it('should render menu button as child', () => {
            render(
                <SidebarProvider>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <a href="/link">Link Button</a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarProvider>
            )
            
            expect(screen.getByRole('link', { name: 'Link Button' })).toBeInTheDocument()
        })
    })

    describe('SidebarMenuAction', () => {
        it('should render menu action', () => {
            render(
                <SidebarProvider>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuAction>Action</SidebarMenuAction>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Action')).toBeInTheDocument()
        })

        it('should render menu action with showOnHover', () => {
            render(
                <SidebarProvider>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuAction showOnHover>Hover Action</SidebarMenuAction>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Hover Action')).toBeInTheDocument()
        })

        it('should render menu action as child', () => {
            render(
                <SidebarProvider>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuAction asChild>
                                <span>Custom Action</span>
                            </SidebarMenuAction>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Custom Action')).toBeInTheDocument()
        })
    })

    describe('SidebarMenuBadge', () => {
        it('should render menu badge', () => {
            render(
                <SidebarProvider>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuBadge>5</SidebarMenuBadge>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarProvider>
            )
            
            expect(screen.getByText('5')).toBeInTheDocument()
        })
    })

    describe('SidebarMenuSkeleton', () => {
        it('should render skeleton', () => {
            render(
                <SidebarProvider>
                    <SidebarMenuSkeleton />
                </SidebarProvider>
            )
            
            expect(document.querySelector('[data-sidebar="menu-skeleton"]')).toBeInTheDocument()
        })

        it('should render skeleton with icon', () => {
            render(
                <SidebarProvider>
                    <SidebarMenuSkeleton showIcon />
                </SidebarProvider>
            )
            
            expect(document.querySelector('[data-sidebar="menu-skeleton-icon"]')).toBeInTheDocument()
        })
    })

    describe('SidebarMenuSub', () => {
        it('should render sub menu', () => {
            render(
                <SidebarProvider>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton>Sub Item</SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Sub Item')).toBeInTheDocument()
        })

        it('should render sub button with different sizes', () => {
            render(
                <SidebarProvider>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton size="sm">Small</SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton size="md">Medium</SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Small')).toHaveAttribute('data-size', 'sm')
            expect(screen.getByText('Medium')).toHaveAttribute('data-size', 'md')
        })

        it('should render active sub button', () => {
            render(
                <SidebarProvider>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive>Active Sub</SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarProvider>
            )
            
            expect(screen.getByText('Active Sub')).toHaveAttribute('data-active', 'true')
        })

        it('should render sub button as child', () => {
            render(
                <SidebarProvider>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                                <a href="/link">Sub Link</a>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarProvider>
            )
            
            expect(screen.getByRole('link', { name: 'Sub Link' })).toBeInTheDocument()
        })
    })

    describe('setOpen with function', () => {
        it('should handle setOpen with function value', () => {
            let setOpenFn: any
            const TestComponent = () => {
                const { open, setOpen } = useSidebar()
                setOpenFn = setOpen
                return <span data-testid="open">{String(open)}</span>
            }
            
            render(
                <SidebarProvider>
                    <TestComponent />
                </SidebarProvider>
            )
            
            expect(screen.getByTestId('open')).toHaveTextContent('true')
            
            act(() => {
                setOpenFn((prev: boolean) => !prev)
            })
            
            expect(screen.getByTestId('open')).toHaveTextContent('false')
        })
    })
})
