import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileExplorer from '../../components/FileExplorer'
import type { FileItem, FileTemplate } from '../../types'

const mockFiles: FileItem[] = [
  { id: 'app.ts', name: 'app.ts', content: 'test', language: 'typescript', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'styles.css', name: 'styles.css', content: '.test {}', language: 'css', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'index.html', name: 'index.html', content: '<html></html>', language: 'html', createdAt: Date.now(), updatedAt: Date.now() }
]

const mockTemplates: Record<string, FileTemplate> = {
  'React Component': { name: 'React Component', defaultExt: '.tsx', content: 'export default function() {}' },
  'CSS Styles': { name: 'CSS Styles', defaultExt: '.css', content: '.container {}' }
}

describe('FileExplorer Component', () => {
  const mockOnSetCreatingFile = vi.fn()
  const mockOnSetNewFileName = vi.fn()
  const mockOnSetSelectedTemplate = vi.fn()
  const mockOnOpenFile = vi.fn()
  const mockOnDeleteFile = vi.fn()
  const mockOnCreateFile = vi.fn()

  const defaultProps = {
    files: mockFiles,
    activeTabId: '',
    isCreatingFile: false,
    newFileName: '',
    selectedTemplate: null,
    templates: mockTemplates,
    onSetCreatingFile: mockOnSetCreatingFile,
    onSetNewFileName: mockOnSetNewFileName,
    onSetSelectedTemplate: mockOnSetSelectedTemplate,
    onOpenFile: mockOnOpenFile,
    onDeleteFile: mockOnDeleteFile,
    onCreateFile: mockOnCreateFile
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all files', () => {
    render(<FileExplorer {...defaultProps} />)
    
    expect(screen.getByText('app.ts')).toBeInTheDocument()
    expect(screen.getByText('styles.css')).toBeInTheDocument()
    expect(screen.getByText('index.html')).toBeInTheDocument()
  })

  it('should highlight active file', () => {
    render(<FileExplorer {...defaultProps} activeTabId="app.ts" />)
    
    const fileItems = document.querySelectorAll('[class*="bg-primary"]')
    expect(fileItems.length).toBeGreaterThan(0)
  })

  it('should call onOpenFile when file clicked', () => {
    render(<FileExplorer {...defaultProps} />)
    
    fireEvent.click(screen.getByText('app.ts'))
    
    expect(mockOnOpenFile).toHaveBeenCalledWith('app.ts')
  })

  it('should show file creation input when isCreatingFile is true', () => {
    render(<FileExplorer {...defaultProps} isCreatingFile={true} />)
    
    expect(screen.getByPlaceholderText('src/components/NewFile.tsx')).toBeInTheDocument()
  })

  it('should not show file creation input when isCreatingFile is false', () => {
    render(<FileExplorer {...defaultProps} isCreatingFile={false} />)
    
    expect(screen.queryByPlaceholderText('src/components/NewFile.tsx')).not.toBeInTheDocument()
  })

  it('should update filename on input change', () => {
    render(<FileExplorer {...defaultProps} isCreatingFile={true} />)
    
    const input = screen.getByPlaceholderText('src/components/NewFile.tsx')
    fireEvent.change(input, { target: { value: 'newfile.ts' } })
    
    expect(mockOnSetNewFileName).toHaveBeenCalledWith('newfile.ts')
  })

  it('should call onCreateFile on Enter key', () => {
    render(<FileExplorer {...defaultProps} isCreatingFile={true} newFileName="test.ts" />)
    
    const input = screen.getByPlaceholderText('src/components/NewFile.tsx')
    fireEvent.keyDown(input, { key: 'Enter' })
    
    expect(mockOnCreateFile).toHaveBeenCalled()
  })

  it('should close file creation on Escape key', () => {
    render(<FileExplorer {...defaultProps} isCreatingFile={true} />)
    
    const input = screen.getByPlaceholderText('src/components/NewFile.tsx')
    fireEvent.keyDown(input, { key: 'Escape' })
    
    expect(mockOnSetCreatingFile).toHaveBeenCalledWith(false)
    expect(mockOnSetSelectedTemplate).toHaveBeenCalledWith(null)
  })

  it('should render template buttons when creating file', () => {
    render(<FileExplorer {...defaultProps} isCreatingFile={true} />)
    
    expect(screen.getByText('React Component')).toBeInTheDocument()
    expect(screen.getByText('CSS Styles')).toBeInTheDocument()
  })

  it('should select template on click', () => {
    render(<FileExplorer {...defaultProps} isCreatingFile={true} />)
    
    fireEvent.mouseDown(screen.getByText('React Component'))
    
    expect(mockOnSetSelectedTemplate).toHaveBeenCalledWith('React Component')
  })

  it('should call onDeleteFile when delete button clicked', () => {
    render(<FileExplorer {...defaultProps} />)
    
    const deleteButtons = screen.getAllByTitle('Delete')
    fireEvent.click(deleteButtons[0])
    
    expect(mockOnDeleteFile).toHaveBeenCalled()
  })

  it('should show context menu on right click', () => {
    render(<FileExplorer {...defaultProps} />)
    
    fireEvent.contextMenu(screen.getByText('app.ts'))
    
    expect(screen.getByText('Rename')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('should handle empty files array', () => {
    render(<FileExplorer {...defaultProps} files={[]} />)
    
    expect(screen.getByText('Empty workspace')).toBeInTheDocument()
  })
})