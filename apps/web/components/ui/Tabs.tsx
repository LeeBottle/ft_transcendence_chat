'use client';

// Tabs — 탭 버튼 줄. 어떤 탭이 눌렸는지(active)와 바뀌었을 때(onChange)만 관리하고,
// 실제 내용은 쓰는 쪽에서 active 값으로 골라 보여준다.
import { cn } from '@/lib/cn';

interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  tabs: ReadonlyArray<TabItem<T>>;
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export default function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn('flex items-center gap-1', className)}
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => {
              onChange(tab.id);
            }}
            className={cn(
              'text-body h-8 cursor-pointer rounded-md px-3 transition-colors',
              selected
                ? 'bg-surface-muted text-text font-medium'
                : 'text-text-muted hover:bg-surface-muted',
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-caption text-text-subtle ml-1">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
