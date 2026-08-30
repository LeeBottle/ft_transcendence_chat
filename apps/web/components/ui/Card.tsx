'use client';

// Card — 테두리 있는 흰 상자. 화면 곳곳의 "박스"를 하나로 통일.
//   padding: none / sm / md(기본)
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type Padding = 'none' | 'sm' | 'md';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
}

const PADDING_CLASS: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
};

export default function Card({ padding = 'md', className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border-border bg-surface border',
        PADDING_CLASS[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
