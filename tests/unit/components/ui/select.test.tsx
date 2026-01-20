/**
 * Unit Tests: Select Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Radix Select due to portal and scrollIntoView issues in jsdom
jest.mock('@radix-ui/react-select', () => ({
    Root: ({ children, disabled, value, onValueChange, defaultValue }: any) => {
        const [selectedValue, setSelectedValue] = React.useState(defaultValue || value || '')
        return (
            <div data-testid="select-root">
                {React.Children.map(children, (child: any) => {
                    if (!child) return null
                    return React.cloneElement(child, {
                        __disabled: disabled,
                        __selectedValue: selectedValue,
                        __onValueChange: (v: string) => {
                            setSelectedValue(v)
                            onValueChange?.(v)
                        }
                    })
                })}
            </div>
        )
    },
    Trigger: React.forwardRef(({ children, __disabled, ...props }: any, ref: any) => (
        <button ref={ref} role="combobox" disabled={__disabled} {...props}>{children}</button>
    )),
    Value: ({ placeholder, __selectedValue }: any) => (
        <span>{__selectedValue || placeholder}</span>
    ),
    Icon: ({ children }: any) => <span>{children}</span>,
    Portal: ({ children }: any) => <>{children}</>,
    Content: React.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} role="listbox" {...props}>{children}</div>
    )),
    Viewport: ({ children }: any) => <div>{children}</div>,
    Group: ({ children }: any) => <div>{children}</div>,
    Label: ({ children }: any) => <span>{children}</span>,
    Item: React.forwardRef(({ children, value, onSelect, __onValueChange, ...props }: any, ref: any) => (
        <div 
            ref={ref} 
            role="option" 
            onClick={() => __onValueChange?.(value)}
            {...props}
        >
            {children}
        </div>
    )),
    ItemText: ({ children }: any) => <span>{children}</span>,
    ItemIndicator: ({ children }: any) => <span>{children}</span>,
    ScrollUpButton: () => null,
    ScrollDownButton: () => null,
    Separator: () => <hr />,
}))

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

describe('Select Component', () => {
    it('should render trigger with placeholder', () => {
        render(
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Select a fruit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="apple">Apple</SelectItem>
                </SelectContent>
            </Select>
        )
        expect(screen.getByText('Select a fruit')).toBeInTheDocument()
        expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should render options in listbox', () => {
        render(
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Select a fruit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Fruits</SelectLabel>
                        <SelectItem value="apple">Apple</SelectItem>
                        <SelectItem value="banana">Banana</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        )

        expect(screen.getByRole('listbox')).toBeInTheDocument()
        expect(screen.getByText('Fruits')).toBeInTheDocument()
        expect(screen.getByText('Apple')).toBeInTheDocument()
        expect(screen.getByText('Banana')).toBeInTheDocument()
    })

    it('should handle disabled state', () => {
        render(
            <Select disabled>
                <SelectTrigger>
                    <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                </SelectContent>
            </Select>
        )
        expect(screen.getByRole('combobox')).toBeDisabled()
    })
})
