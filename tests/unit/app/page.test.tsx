/**
 * Tests for app/page.tsx (Home page)
 */

import { render, screen } from '@testing-library/react'

// Mock the child components
jest.mock('@/app/components/chat/chat-container', () => ({
  ChatContainer: () => <div data-testid="chat-container">Chat Container</div>,
}))

jest.mock('@/app/components/layout/layout-app', () => ({
  LayoutApp: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout-app">{children}</div>
  ),
}))

jest.mock('@/lib/chat-store/messages/provider', () => ({
  MessagesProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="messages-provider">{children}</div>
  ),
}))

import Home from '@/app/page'

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render MessagesProvider', () => {
    render(<Home />)

    expect(screen.getByTestId('messages-provider')).toBeInTheDocument()
  })

  it('should render LayoutApp inside MessagesProvider', () => {
    render(<Home />)

    const messagesProvider = screen.getByTestId('messages-provider')
    const layoutApp = screen.getByTestId('layout-app')

    expect(messagesProvider).toContainElement(layoutApp)
  })

  it('should render ChatContainer inside LayoutApp', () => {
    render(<Home />)

    const layoutApp = screen.getByTestId('layout-app')
    const chatContainer = screen.getByTestId('chat-container')

    expect(layoutApp).toContainElement(chatContainer)
  })

  it('should render complete component hierarchy', () => {
    render(<Home />)

    // Verify the full hierarchy: MessagesProvider > LayoutApp > ChatContainer
    expect(screen.getByTestId('messages-provider')).toBeInTheDocument()
    expect(screen.getByTestId('layout-app')).toBeInTheDocument()
    expect(screen.getByTestId('chat-container')).toBeInTheDocument()
  })
})
