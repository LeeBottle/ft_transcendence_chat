'use client';

// Heading / Text — 타이포그래피 스케일(@theme --text-*)을 컴포넌트로.
//   <Heading level={2}>제목</Heading>   ·   <Text variant="caption" muted>부가설명</Text>
import type { ElementType, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type HeadingLevel = 1 | 2 | 3;

const HEADING_CLASS: Record<HeadingLevel, string> = {
  1: 'text-h1 font-bold',
  2: 'text-h2 font-semibold',
  3: 'text-h3 font-semibold',
};

export function Heading({
  level = 2,
  children,
  className,
}: {
  level?: HeadingLevel;
  children: ReactNode;
  className?: string;
}) {
  const Tag = `h${level}` as ElementType;

  return <Tag className={cn(HEADING_CLASS[level], 'text-text', className)}>{children}</Tag>;
}

type TextVariant = 'body' | 'caption';

type TextTone = 'default' | 'muted' | 'subtle';

const TONE_CLASS: Record<TextTone, string> = {
  default: 'text-text',
  muted: 'text-text-muted',
  subtle: 'text-text-subtle',
};

export function Text({
  variant = 'body',
  tone = 'default',
  children,
  className,
}: {
  variant?: TextVariant;
  tone?: TextTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        variant === 'caption' ? 'text-caption' : 'text-body',
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}
