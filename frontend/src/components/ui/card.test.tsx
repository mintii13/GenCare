import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardTitle, CardDescription } from './card';

describe('Card UI', () => {
  it('renders basic card', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with CardTitle and CardDescription', () => {
    render(
      <Card>
        <CardTitle>Tiêu đề</CardTitle>
        <CardDescription>Mô tả</CardDescription>
        Nội dung
      </Card>
    );
    expect(screen.getByText('Tiêu đề')).toBeInTheDocument();
    expect(screen.getByText('Mô tả')).toBeInTheDocument();
    expect(screen.getByText('Nội dung')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(<Card className="my-card">Custom</Card>);
    expect(container.firstChild).toHaveClass('my-card');
  });
}); 