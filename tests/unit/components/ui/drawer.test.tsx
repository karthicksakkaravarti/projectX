/**
 * Unit Tests: Drawer Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'

// Mock Vaul to avoid JSDOM issues with its portal/snap logic
jest.mock('vaul', () => ({
    Drawer: {
        Root: ({ children, open, ...props }: any) => (
            <div data-testid="drawer-root" data-open={open !== false} {...props}>{children}</div>
        ),
        Trigger: React.forwardRef(({ children, ...props }: any, ref: any) => (
            <button ref={ref} {...props}>{children}</button>
        )),
        Portal: ({ children }: any) => <>{children}</>,
        Close: React.forwardRef(({ children, ...props }: any, ref: any) => (
            <button ref={ref} {...props}>{children}</button>
        )),
        Overlay: React.forwardRef((props: any, ref: any) => (
            <div ref={ref} data-testid="drawer-overlay" {...props} />
        )),
        Content: React.forwardRef(({ children, ...props }: any, ref: any) => (
            <div ref={ref} role="dialog" {...props}>{children}</div>
        )),
        Title: React.forwardRef(({ children, ...props }: any, ref: any) => (
            <h2 ref={ref} {...props}>{children}</h2>
        )),
        Description: React.forwardRef(({ children, ...props }: any, ref: any) => (
            <p ref={ref} {...props}>{children}</p>
        )),
    }
}))

describe('Drawer Component', () => {
    it('should render trigger', () => {
        render(
            <Drawer>
                <DrawerTrigger>Open Drawer</DrawerTrigger>
                <DrawerContent>Content</DrawerContent>
            </Drawer>
        )
        expect(screen.getByRole('button', { name: 'Open Drawer' })).toBeInTheDocument()
    })

    it('should render drawer with header and footer', () => {
        render(
            <Drawer open>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Title</DrawerTitle>
                        <DrawerDescription>Description</DrawerDescription>
                    </DrawerHeader>
                    <div>Body</div>
                    <DrawerFooter>
                        <DrawerClose>Close</DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )

        expect(screen.getByText('Title')).toBeInTheDocument()
        expect(screen.getByText('Description')).toBeInTheDocument()
        expect(screen.getByText('Body')).toBeInTheDocument()
        expect(screen.getByText('Close')).toBeInTheDocument()
    })

    it('should render drawer footer correctly', () => {
        render(
            <Drawer open>
                <DrawerContent>
                    <DrawerFooter>
                        <button>Action</button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
        expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })
})
