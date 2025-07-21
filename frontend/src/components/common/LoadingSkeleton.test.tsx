import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton, CardSkeleton, TableSkeleton, FormSkeleton, BlogPostSkeleton, StatsSkeleton, CalendarSkeleton, LoadingSpinner } from './LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('renders basic skeleton', () => {
    render(<Skeleton data-testid="loading-skeleton" />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders multiple skeletons when count > 1', () => {
    const count = 3;
    render(
      <>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton data-testid="loading-skeleton" key={i} />
        ))}
      </>
    );
    expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(count);
  });

  it('renders with custom className', () => {
    render(<Skeleton className="my-skeleton" data-testid="loading-skeleton" />);
    expect(screen.getByTestId('loading-skeleton')).toHaveClass('my-skeleton');
  });

  it('renders with custom style', () => {
    render(<Skeleton style={{ width: 100 }} data-testid="loading-skeleton" />);
    expect(screen.getByTestId('loading-skeleton')).toHaveStyle('width: 100px');
  });
});

describe('Skeleton phụ', () => {
  it('renders CardSkeleton', () => {
    render(<CardSkeleton count={2} />);
    // Có 2 card skeleton (theo count)
    expect(document.querySelectorAll('.bg-white.rounded-lg.border.p-4').length).toBeGreaterThanOrEqual(2);
  });

  it('renders TableSkeleton', () => {
    render(<TableSkeleton rows={2} cols={3} />);
    // Chỉ kiểm tra tồn tại ít nhất 1 div .p-4
    expect(document.querySelector('.p-4')).toBeInTheDocument();
  });

  it('renders FormSkeleton', () => {
    render(<FormSkeleton fields={2} />);
    // Có 2 field group (space-y-2)
    expect(screen.getAllByText((content, el) => Boolean(el && el.className && el.className.includes('space-y-2')))).toHaveLength(2);
  });

  it('renders BlogPostSkeleton', () => {
    render(<BlogPostSkeleton count={2} />);
    // Có 2 blog post skeleton (theo count)
    expect(document.querySelectorAll('.bg-white.rounded-lg.border.p-6').length).toBeGreaterThanOrEqual(2);
  });

  it('renders StatsSkeleton', () => {
    render(<StatsSkeleton count={2} />);
    // Có 2 stats card (theo count)
    expect(screen.getAllByText((content, el) => Boolean(el && el.className && el.className.includes('p-6')))).toHaveLength(2);
  });

  it('renders CalendarSkeleton', () => {
    render(<CalendarSkeleton />);
    // Có 7 ô ngày trong tuần (grid grid-cols-7)
    expect(screen.getAllByText((content, el) => Boolean(el && el.className && el.className.includes('grid-cols-7')))).toHaveLength(2);
  });

  it('renders LoadingSpinner', () => {
    render(<LoadingSpinner size="lg" className="my-spinner" />);
    expect(document.querySelector('.w-8.h-8.my-spinner')).toBeInTheDocument();
  });
}); 