'use client';

// Avatar — 프로필 사진. 사진이 없으면 이름 첫 글자를 보라 원 안에 보여준다.
//   status 를 주면 오른쪽 아래에 온라인/오프라인 점이 붙는다.
import StatusDot from '@/components/ui/StatusDot';
import { cn } from '@/lib/cn';

type Size = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: Size;
  status?: 'online' | 'offline';
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'w-8 h-8 text-body',
  md: 'w-12 h-12 text-h3',
  lg: 'w-17 h-17 text-h1',
};

function Avatar({ name, imageUrl, size = 'md', status }: AvatarProps) {
  const sizeClass = SIZE_CLASS[size];

  return (
    <span className="relative inline-block shrink-0">
      {typeof imageUrl === 'string' && imageUrl.length > 0 ? (
        <img
          src={imageUrl}
          alt={`${name} 프로필`}
          className={cn(sizeClass, 'rounded-full object-cover')}
        />
      ) : (
        <span
          className={cn(
            sizeClass,
            'bg-primary flex items-center justify-center rounded-full font-bold text-white',
          )}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}

      {status !== undefined && (
        <StatusDot
          online={status === 'online'}
          size="sm"
          ring
          className="absolute -right-0.5 -bottom-0.5"
        />
      )}
    </span>
  );
}

export default Avatar;
