/**
 * Unit Tests: app/components/multi-chat/multi-chat-input.tsx
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiChatInput } from '@/app/components/multi-chat/multi-chat-input'
import { TooltipProvider } from '@/components/ui/tooltip'

// Mock the MultiModelSelector component
jest.mock('@/components/common/multi-model-selector/base', () => ({
    MultiModelSelector: ({ selectedModelIds, setSelectedModelIds }: {
        selectedModelIds: string[]
        setSelectedModelIds: (ids: string[]) => void
    }) => (
        <div data-testid="multi-model-selector">
            <span data-testid="selected-count">{selectedModelIds.length}</span>
            <button
                data-testid="add-model"
                onClick={() => setSelectedModelIds([...selectedModelIds, 'new-model'])}
            >
                Add Model
            </button>
        </div>
    ),
}))

// Mock Phosphor icons
jest.mock('@phosphor-icons/react', () => ({
    ArrowUp: () => <span data-testid="arrow-up-icon">↑</span>,
    Stop: () => <span data-testid="stop-icon">■</span>,
}))

// Wrapper with required providers
const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TooltipProvider>{children}</TooltipProvider>
)

const defaultProps = {
    value: '',
    onValueChange: jest.fn(),
    onSend: jest.fn(),
    isSubmitting: false,
    files: [] as File[],
    onFileUpload: jest.fn(),
    onFileRemove: jest.fn(),
    selectedModelIds: ['gpt-4'],
    onSelectedModelIdsChange: jest.fn(),
    isUserAuthenticated: true,
    stop: jest.fn(),
    status: 'ready' as const,
    anyLoading: false,
}

describe('MultiChatInput Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should render the component', () => {
            render(
                <Wrapper>
                    <MultiChatInput {...defaultProps} />
                </Wrapper>
            )

            expect(screen.getByPlaceholderText('Ask all selected models...')).toBeInTheDocument()
        })

        it('should render the MultiModelSelector', () => {
            render(
                <Wrapper>
                    <MultiChatInput {...defaultProps} />
                </Wrapper>
            )

            expect(screen.getByTestId('multi-model-selector')).toBeInTheDocument()
        })

        it('should render the send button', () => {
            render(
                <Wrapper>
                    <MultiChatInput {...defaultProps} />
                </Wrapper>
            )

            expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
        })

        it('should show ArrowUp icon when not streaming', () => {
            render(
                <Wrapper>
                    <MultiChatInput {...defaultProps} status="ready" />
                </Wrapper>
            )

            expect(screen.getByTestId('arrow-up-icon')).toBeInTheDocument()
        })

        it('should show Stop icon when streaming', () => {
            render(
                <Wrapper>
                    <MultiChatInput {...defaultProps} status="streaming" />
                </Wrapper>
            )

            expect(screen.getByTestId('stop-icon')).toBeInTheDocument()
        })

        it('should show Stop icon when anyLoading is true', () => {
            render(
                <Wrapper>
                    <MultiChatInput {...defaultProps} anyLoading={true} />
                </Wrapper>
            )

            expect(screen.getByTestId('stop-icon')).toBeInTheDocument()
        })
    })

    describe('Input handling', () => {
        it('should display the provided value', () => {
            render(
                <Wrapper>
                    <MultiChatInput {...defaultProps} value="Hello world" />
                </Wrapper>
            )

            const textarea = screen.getByPlaceholderText('Ask all selected models...')
            expect(textarea).toHaveValue('Hello world')
        })

        it('should call onValueChange when typing', async () => {
            const onValueChange = jest.fn()
            render(
                <Wrapper>
                    <MultiChatInput {...defaultProps} onValueChange={onValueChange} />
                </Wrapper>
            )

            const textarea = screen.getByPlaceholderText('Ask all selected models...')
            await userEvent.type(textarea, 'test')

            expect(onValueChange).toHaveBeenCalled()
        })
    })

    describe('Send functionality', () => {
        it('should call onSend when send button is clicked', async () => {
            const onSend = jest.fn()
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        value="Hello"
                        onSend={onSend}
                    />
                </Wrapper>
            )

            const sendButton = screen.getByRole('button', { name: /send message/i })
            await userEvent.click(sendButton)

            expect(onSend).toHaveBeenCalled()
        })

        it('should call onSend when Enter is pressed without Shift', () => {
            const onSend = jest.fn()
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        value="Hello"
                        onSend={onSend}
                    />
                </Wrapper>
            )

            const textarea = screen.getByPlaceholderText('Ask all selected models...')
            fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

            expect(onSend).toHaveBeenCalled()
        })

        it('should not call onSend when Shift+Enter is pressed', () => {
            const onSend = jest.fn()
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        value="Hello"
                        onSend={onSend}
                    />
                </Wrapper>
            )

            const textarea = screen.getByPlaceholderText('Ask all selected models...')
            fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

            expect(onSend).not.toHaveBeenCalled()
        })

        it('should not call onSend when value is only whitespace', () => {
            const onSend = jest.fn()
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        value="   "
                        onSend={onSend}
                    />
                </Wrapper>
            )

            const textarea = screen.getByPlaceholderText('Ask all selected models...')
            fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

            expect(onSend).not.toHaveBeenCalled()
        })
    })

    describe('Button disabled state', () => {
        it('should disable button when value is empty', () => {
            render(
                <Wrapper>
                    <MultiChatInput {...defaultProps} value="" />
                </Wrapper>
            )

            const sendButton = screen.getByRole('button', { name: /send message/i })
            expect(sendButton).toBeDisabled()
        })

        it('should disable button when isSubmitting is true', () => {
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        value="Hello"
                        isSubmitting={true}
                    />
                </Wrapper>
            )

            const sendButton = screen.getByRole('button', { name: /send message/i })
            expect(sendButton).toBeDisabled()
        })

        it('should disable button when anyLoading is true', () => {
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        value="Hello"
                        anyLoading={true}
                    />
                </Wrapper>
            )

            const sendButton = screen.getByRole('button', { name: /send message/i })
            expect(sendButton).toBeDisabled()
        })

        it('should disable button when value is only whitespace', () => {
            render(
                <Wrapper>
                    <MultiChatInput {...defaultProps} value="   " />
                </Wrapper>
            )

            const sendButton = screen.getByRole('button', { name: /send message/i })
            expect(sendButton).toBeDisabled()
        })

        it('should disable button when no models are selected', () => {
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        value="Hello"
                        selectedModelIds={[]}
                    />
                </Wrapper>
            )

            const sendButton = screen.getByRole('button', { name: /send message/i })
            expect(sendButton).toBeDisabled()
        })

        it('should enable button when all conditions are met', () => {
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        value="Hello"
                        selectedModelIds={['gpt-4']}
                        isSubmitting={false}
                        anyLoading={false}
                    />
                </Wrapper>
            )

            const sendButton = screen.getByRole('button', { name: /send message/i })
            expect(sendButton).not.toBeDisabled()
        })
    })

    describe('Stop functionality', () => {
        it('should call stop when button is clicked during streaming', async () => {
            const stop = jest.fn()
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        value="Hello"
                        status="streaming"
                        stop={stop}
                    />
                </Wrapper>
            )

            const stopButton = screen.getByRole('button', { name: /stop/i })
            await userEvent.click(stopButton)

            expect(stop).toHaveBeenCalled()
        })

        it('should prevent Enter key during streaming', () => {
            const onSend = jest.fn()
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        value="Hello"
                        status="streaming"
                        onSend={onSend}
                    />
                </Wrapper>
            )

            const textarea = screen.getByPlaceholderText('Ask all selected models...')
            fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

            expect(onSend).not.toHaveBeenCalled()
        })
    })

    describe('Submitting state', () => {
        it('should prevent key actions when isSubmitting', () => {
            const onSend = jest.fn()
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        value="Hello"
                        isSubmitting={true}
                        onSend={onSend}
                    />
                </Wrapper>
            )

            const textarea = screen.getByPlaceholderText('Ask all selected models...')
            fireEvent.keyDown(textarea, { key: 'Enter' })

            expect(onSend).not.toHaveBeenCalled()
        })

        it('should prevent send button click when isSubmitting', async () => {
            const onSend = jest.fn()
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        value="Hello"
                        isSubmitting={true}
                        onSend={onSend}
                    />
                </Wrapper>
            )

            const sendButton = screen.getByRole('button', { name: /send message/i })
            await userEvent.click(sendButton)

            // Button is disabled, so onSend should not be called
            expect(onSend).not.toHaveBeenCalled()
        })
    })

    describe('Model selection', () => {
        it('should display selected model count', () => {
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        selectedModelIds={['gpt-4', 'claude']}
                    />
                </Wrapper>
            )

            expect(screen.getByTestId('selected-count')).toHaveTextContent('2')
        })

        it('should call onSelectedModelIdsChange when model is added', async () => {
            const onSelectedModelIdsChange = jest.fn()
            render(
                <Wrapper>
                    <MultiChatInput
                        {...defaultProps}
                        onSelectedModelIdsChange={onSelectedModelIdsChange}
                    />
                </Wrapper>
            )

            const addButton = screen.getByTestId('add-model')
            await userEvent.click(addButton)

            expect(onSelectedModelIdsChange).toHaveBeenCalledWith(['gpt-4', 'new-model'])
        })
    })

    describe('Accessibility', () => {
        it('should have correct aria-label for send button', () => {
            render(
                <Wrapper>
                    <MultiChatInput {...defaultProps} status="ready" />
                </Wrapper>
            )

            expect(screen.getByLabelText('Send message')).toBeInTheDocument()
        })

        it('should have correct aria-label for stop button', () => {
            render(
                <Wrapper>
                    <MultiChatInput {...defaultProps} status="streaming" />
                </Wrapper>
            )

            expect(screen.getByLabelText('Stop')).toBeInTheDocument()
        })
    })
})
