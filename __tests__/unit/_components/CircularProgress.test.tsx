import React from 'react';
import { render, screen } from '@testing-library/react';
import CircularProgress from '../../../app/_components/CircularProgress';

describe('CircularProgress', () => {
  it('renders with default props', () => {
    render(<CircularProgress value={50} />);
    
    const progressElement = screen.getByRole('progressbar');
    expect(progressElement).toBeInTheDocument();
    expect(progressElement).toHaveClass('radial-progress');
    expect(progressElement).toHaveClass('text-primary');
    
    const style = window.getComputedStyle(progressElement);
    expect(progressElement).toHaveStyle({
      '--value': '50',
      '--size': '2rem',
      '--thickness': '0.5rem'
    });
  });

  it('renders with custom size', () => {
    render(<CircularProgress value={75} size="4rem" />);
    
    const progressElement = screen.getByRole('progressbar');
    expect(progressElement).toHaveStyle({
      '--value': '75',
      '--size': '4rem',
      '--thickness': '0.5rem'
    });
  });

  it('renders with custom thickness', () => {
    render(<CircularProgress value={25} thickness="0.8rem" />);
    
    const progressElement = screen.getByRole('progressbar');
    expect(progressElement).toHaveStyle({
      '--value': '25',
      '--size': '2rem',
      '--thickness': '0.8rem'
    });
  });

  it('renders with custom className', () => {
    render(<CircularProgress value={100} className="custom-class" />);
    
    const progressElement = screen.getByRole('progressbar');
    expect(progressElement).toHaveClass('custom-class');
    expect(progressElement).toHaveClass('radial-progress');
    expect(progressElement).toHaveClass('text-primary');
  });

  it('rounds the value to the nearest integer', () => {
    render(<CircularProgress value={66.7} />);
    
    const progressElement = screen.getByRole('progressbar');
    expect(progressElement).toHaveStyle({
      '--value': '67'
    });
  });
});