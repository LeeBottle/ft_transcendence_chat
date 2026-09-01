'use client';
// Sidebar.tsx
// 여러 feature에서 공유하는 사이드바 뼈대
// admin은 항목 구성이 완전히 달라 feature/admin 안에서 별도로 구성 예정

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

function Sidebar({ items, activeId, onSelect }: SidebarProps) {
  return (
    <nav className="flex flex-col gap-1 px-1.5 py-4 md:px-3">
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <button
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            title={item.label}
            className={`text-body flex h-10 cursor-pointer items-center justify-center gap-0 rounded-lg px-0 text-left transition-colors md:justify-start md:gap-2 md:px-3 ${
              isActive ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-muted'
            } `}
          >
            {item.icon}
            <span className="hidden md:inline">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default Sidebar;
