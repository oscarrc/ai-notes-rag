import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ButtonSquare from '../../../app/_components/ButtonSquare';

describe('ButtonSquare', () => {
  it('renders correctly with default props', () => {
    render(
      <ButtonSquare>
        <span>Click me</span>
      </ButtonSquare>
    );
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn');
    expect(button).toHaveClass('btn-square');
    expect(button).toHaveClass('btn-ghost');
    expect(button).not.toHaveClass('btn-lg');
    expect(button).not.toHaveClass('btn-sm');
    expect(button).not.toHaveClass('btn-xs');
  });

  it('applies custom className', () => {
    render(
      <ButtonSquare className="custom-class">
        <span>Click me</span>
      </ButtonSquare>
    );
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toHaveClass('custom-class');
  });

  it('supports different sizes', () => {
    const { rerender } = render(
      <ButtonSquare size="lg">
        <span>Large Button</span>
      </ButtonSquare>
    );
    
    let button = screen.getByRole('button', { name: 'Large Button' });
    expect(button).toHaveClass('btn-lg');
    
    rerender(
      <ButtonSquare size="sm">
        <span>Small Button</span>
      </ButtonSquare>
    );
    
    button = screen.getByRole('button', { name: 'Small Button' });
    expect(button).toHaveClass('btn-sm');
    
    rerender(
      <ButtonSquare size="xs">
        <span>Extra Small Button</span>
      </ButtonSquare>
    );
    
    button = screen.getByRole('button', { name: 'Extra Small Button' });
    expect(button).toHaveClass('btn-xs');
  });

  it('can be disabled', () => {
    render(
      <ButtonSquare disabled>
        <span>Disabled Button</span>
      </ButtonSquare>
    );
    
    const button = screen.getByRole('button', { name: 'Disabled Button' });
    expect(button).toBeDisabled();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    
    render(
      <ButtonSquare onClick={handleClick}>
        <span>Clickable Button</span>
      </ButtonSquare>
    );
    
    const button = screen.getByRole('button', { name: 'Clickable Button' });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('adds tooltip attributes when tooltip class is present', () => {
    render(
      <ButtonSquare className="tooltip" tip="Helpful tip">
        <span>Tooltip Button</span>
      </ButtonSquare>
    );
    
    const button = screen.getByRole('button', { name: 'Tooltip Button' });
    expect(button).toHaveAttribute('data-tip', 'Helpful tip');
  });

  it('does not add tooltip attributes when tooltip class is absent', () => {
    render(
      <ButtonSquare tip="Helpful tip">
        <span>No Tooltip Button</span>
      </ButtonSquare>
    );
    
    const button = screen.getByRole('button', { name: 'No Tooltip Button' });
    expect(button).not.toHaveAttribute('data-tip');
  });
});