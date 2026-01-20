/**
 * Unit Tests: Command Component
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'

describe('Command Component', () => {
    it('should render command interface', () => {
        render(
            <Command>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                        <CommandItem>Calendar</CommandItem>
                        <CommandItem>Search Emoji</CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        )

        expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument()
        expect(screen.getByText('Calendar')).toBeInTheDocument()
        expect(screen.getByText('Search Emoji')).toBeInTheDocument()
    })

    it('should filter items based on input', async () => {
        const user = userEvent.setup()
        render(
            <Command>
                <CommandInput placeholder="Search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                        <CommandItem>Apple</CommandItem>
                        <CommandItem>Banana</CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        )

        const input = screen.getByPlaceholderText('Search...')
        await user.type(input, 'App')

        // Wait for filtering to occur
        await waitFor(() => {
            expect(screen.getByText('Apple')).toBeInTheDocument()
        })
        // Banana should be filtered out
        await waitFor(() => {
            expect(screen.queryByText('Banana')).not.toBeInTheDocument()
        })
    })

    it('should handle item selection', async () => {
        const user = userEvent.setup()
        const handleSelect = jest.fn()

        render(
            <Command>
                <CommandInput />
                <CommandList>
                    <CommandGroup>
                        <CommandItem onSelect={handleSelect}>Select Me</CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        )

        await user.click(screen.getByText('Select Me'))
        expect(handleSelect).toHaveBeenCalledTimes(1)
    })
})
