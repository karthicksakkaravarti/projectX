/**
 * Unit Tests: useAssistantMessageSelection Hook
 * Tests for text selection handling in assistant messages
 */

import { renderHook, act } from '@testing-library/react'
import { useAssistantMessageSelection } from '@/app/components/chat/useAssistantMessageSelection'

describe('useAssistantMessageSelection Hook', () => {
    let mockElement: HTMLElement
    let mockRef: { current: HTMLElement | null }

    beforeEach(() => {
        mockElement = document.createElement('div')
        mockRef = { current: mockElement }
        document.body.appendChild(mockElement)

        // Mock getSelection
        window.getSelection = jest.fn().mockReturnValue({
            toString: () => '',
            rangeCount: 0,
            getRangeAt: jest.fn(),
            removeAllRanges: jest.fn(),
        })
    })

    afterEach(() => {
        document.body.innerHTML = ''
        jest.clearAllMocks()
    })

    it('should initialize with null selection info', () => {
        const { result } = renderHook(() => useAssistantMessageSelection(mockRef, true))
        expect(result.current.selectionInfo).toBeNull()
    })

    it('should NOT listen to events if disabled', () => {
        const addSpy = jest.spyOn(document, 'addEventListener')

        renderHook(() => useAssistantMessageSelection(mockRef, false))

        expect(addSpy).not.toHaveBeenCalledWith('mouseup', expect.any(Function))
    })

    it('should clear selection on selection start', () => {
        const { result } = renderHook(() => useAssistantMessageSelection(mockRef, true))

        // Simulate existing selection info
        // We can't easily force state without interacting with listeners
        // But we can trigger the event handler

        // Trigger selectstart on ref element
        const event = new Event('selectstart')
        act(() => {
            mockRef.current?.dispatchEvent(event)
        })

        expect(result.current.selectionInfo).toBeNull()
    })

    it('should ignore short selections', () => {
        const { result } = renderHook(() => useAssistantMessageSelection(mockRef, true))

        // Mock selection
        const mockRange = {
            commonAncestorContainer: mockElement,
            getBoundingClientRect: () => ({ left: 0, top: 0, right: 10, bottom: 10 }),
        };
        (window.getSelection as jest.Mock).mockReturnValue({
            toString: () => 'hi', // < 3 chars
            rangeCount: 1,
            getRangeAt: () => mockRange,
        })

        // Use a data attribute for finding ID
        mockElement.setAttribute('data-message-id', 'msg-1')

        // Trigger mouseup
        const event = new MouseEvent('mouseup', { bubbles: true })
        act(() => {
            document.dispatchEvent(event)
        })

        expect(result.current.selectionInfo).toBeNull()
    })

    it('should capture valid selection', () => {
        const { result } = renderHook(() => useAssistantMessageSelection(mockRef, true))

        // Setup element with ID
        mockElement.setAttribute('data-message-id', 'msg-1')

        // Mock selection
        const mockRange = {
            commonAncestorContainer: mockElement,
            getBoundingClientRect: () => ({ left: 10, top: 10, right: 100, bottom: 50 }),
        };
        (window.getSelection as jest.Mock).mockReturnValue({
            toString: () => 'valid selection',
            rangeCount: 1,
            getRangeAt: () => mockRange,
        })

        // Trigger mouseup
        const event = new MouseEvent('mouseup', { bubbles: true, clientX: 50, clientY: 20 })
        act(() => {
            document.dispatchEvent(event)
        })

        expect(result.current.selectionInfo).toEqual(expect.objectContaining({
            text: 'valid selection',
            messageId: 'msg-1',
            position: expect.any(Object)
        }))
    })

    it('should clear selection manually', () => {
        const { result } = renderHook(() => useAssistantMessageSelection(mockRef, true))

        act(() => {
            result.current.clearSelection()
        })

        expect(window.getSelection()?.removeAllRanges).toHaveBeenCalled()
        expect(result.current.selectionInfo).toBeNull()
    })
})
