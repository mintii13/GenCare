import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';
import { MemoryRouter } from 'react-router-dom';

describe('Button UI', () => {
  it('renders basic button', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders with variant and size', () => {
    render(<Button variant="secondary" size="lg">Big Button</Button>);
    expect(screen.getByText('Big Button')).toBeInTheDocument();
  });

  it('renders as Link when href is provided', () => {
    render(
      <MemoryRouter>
        <Button href="/test">Go to test</Button>
      </MemoryRouter>
    );
    expect(screen.getByText('Go to test').closest('a')).toHaveAttribute('href', '/test');
  });

  it('renders disabled button', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('renders with custom className', () => {
    render(<Button className="my-custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('my-custom-class');
  });

  it('renders with type submit', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });
}); 