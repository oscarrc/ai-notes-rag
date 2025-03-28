import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Tab from '../../../app/@tabbar/_components/Tab';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe('Tab', () => {
  const mockFile: Partial<FileNode> = {
    name: 'test-file.md',
    path: '/vault/test-file.md'
  };
  
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct file name', () => {
    render(
      <Tab 
        file={mockFile} 
        isActive={false} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('test-file.md')).toBeInTheDocument();
    expect(screen.getByRole('tab')).toHaveAttribute('href', '/vault/test-file.md');
  });

  it('applies active class when isActive is true', () => {
    render(
      <Tab 
        file={mockFile} 
        isActive={true} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByRole('tab')).toHaveClass('tab-active');
  });

  it('does not apply active class when isActive is false', () => {
    render(
      <Tab 
        file={mockFile} 
        isActive={false} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByRole('tab')).not.toHaveClass('tab-active');
  });

  it('shows close button with opacity 1 when active', () => {
    render(
      <Tab 
        file={mockFile} 
        isActive={true} 
        onClose={mockOnClose} 
      />
    );
    
    const closeButton = screen.getByRole('button');
    expect(closeButton).toHaveClass('opacity-1');
    expect(closeButton).not.toHaveClass('opacity-0');
  });

  it('shows close button with opacity 0 when not active', () => {
    render(
      <Tab 
        file={mockFile} 
        isActive={false} 
        onClose={mockOnClose} 
      />
    );
    
    const closeButton = screen.getByRole('button');
    expect(closeButton).toHaveClass('opacity-0');
    expect(closeButton).not.toHaveClass('opacity-1');
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Tab 
        file={mockFile} 
        isActive={true} 
        onClose={mockOnClose} 
      />
    );
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles close button click', () => {
    render(
      <Tab 
        file={mockFile} 
        isActive={true} 
        onClose={mockOnClose} 
      />
    );
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('uses default path when file.path is undefined', () => {
    const fileWithoutPath: Partial<FileNode> = {
      name: 'test-file.md'
    };
    
    render(
      <Tab 
        file={fileWithoutPath} 
        isActive={false} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByRole('tab')).toHaveAttribute('href', '/');
  });
});