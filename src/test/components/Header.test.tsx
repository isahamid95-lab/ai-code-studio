import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from '../../components/Header'

vi.mock('../../utils/export', () => ({
  exportWorkspaceAsZip: vi.fn()
}))

describe('Header Component', () => {
  const mockOnOpenSettings = vi.fn()
  const mockOnOpenShortcuts = vi.fn()
  const mockOnOpenTheme = vi.fn()
  const mockOnRunCode = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the app title', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={false}
      />
    )
    
    expect(screen.getByText('AI Code Studio')).toBeInTheDocument()
  })

  it('should render theme button', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={false}
      />
    )
    
    expect(screen.getByTitle('Theme Settings')).toBeInTheDocument()
  })

  it('should render settings button', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={false}
      />
    )
    
    expect(screen.getByTitle('Settings')).toBeInTheDocument()
  })

  it('should render shortcuts button', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={false}
      />
    )
    
    expect(screen.getByTitle('Keyboard Shortcuts')).toBeInTheDocument()
  })

  it('should render export button', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={false}
      />
    )
    
    expect(screen.getByTitle('Export Project')).toBeInTheDocument()
  })

  it('should render run button', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={false}
      />
    )
    
    expect(screen.getByText('Run')).toBeInTheDocument()
  })

  it('should call onOpenTheme when theme button clicked', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={false}
      />
    )
    
    fireEvent.click(screen.getByTitle('Theme Settings'))
    
    expect(mockOnOpenTheme).toHaveBeenCalledTimes(1)
  })

  it('should call onOpenSettings when settings button clicked', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={false}
      />
    )
    
    fireEvent.click(screen.getByTitle('Settings'))
    
    expect(mockOnOpenSettings).toHaveBeenCalledTimes(1)
  })

  it('should call onOpenShortcuts when shortcuts button clicked', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={false}
      />
    )
    
    fireEvent.click(screen.getByTitle('Keyboard Shortcuts'))
    
    expect(mockOnOpenShortcuts).toHaveBeenCalledTimes(1)
  })

  it('should disable run button when no active file', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={false}
      />
    )
    
    const runButton = screen.getByText('Run').closest('button')
    
    expect(runButton).toBeDisabled()
  })

  it('should enable run button when has active file', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={true}
      />
    )
    
    const runButton = screen.getByText('Run').closest('button')
    
    expect(runButton).not.toBeDisabled()
  })

  it('should call onRunCode when run button clicked with active file', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={true}
      />
    )
    
    fireEvent.click(screen.getByText('Run'))
    
    expect(mockOnRunCode).toHaveBeenCalledTimes(1)
  })

  it('should not call onRunCode when run button clicked without active file', () => {
    render(
      <Header
        onOpenSettings={mockOnOpenSettings}
        onOpenShortcuts={mockOnOpenShortcuts}
        onOpenTheme={mockOnOpenTheme}
        onRunCode={mockOnRunCode}
        hasActiveFile={false}
      />
    )
    
    fireEvent.click(screen.getByText('Run'))
    
    expect(mockOnRunCode).not.toHaveBeenCalled()
  })
})