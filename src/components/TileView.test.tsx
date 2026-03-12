import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TileView } from './TileView';
import type { Tile } from '../types';

const dotFive: Tile = { _type: 'dot', value: 5, count: 4 };

describe('TileView', () => {
  it('renders a tile image with correct src and title', () => {
    render(<TileView tile={dotFive} />);
    const img = document.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', `${import.meta.env.BASE_URL}tiles/dots_5.svg`);
    const wrapper = screen.getByTitle('Dot 5');
    expect(wrapper).toBeInTheDocument();
  });

  it('uses custom className', () => {
    const { container } = render(<TileView tile={dotFive} className="h-16 w-12" />);
    const span = container.querySelector('span.inline-flex');
    expect(span).toHaveClass('h-16', 'w-12');
  });

  it('renders as button when asButton is true', () => {
    const onClick = vi.fn();
    render(<TileView tile={dotFive} asButton onClick={onClick} />);
    const btn = screen.getByRole('button', { name: 'Dot 5' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('type', 'button');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('uses custom aria-label when provided', () => {
    render(<TileView tile={dotFive} asButton aria-label="Discard Dot 5" />);
    expect(screen.getByRole('button', { name: 'Discard Dot 5' })).toBeInTheDocument();
  });

  it('disables button when disabled is true', () => {
    render(<TileView tile={dotFive} asButton disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
