'use client';
// Avatar.tsx
// .room-av, .msg-av, my-page 아바타 등 여러 곳의 아바타 UI를 통합

interface AvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-lg',
  lg: 'w-17 h-17 text-2xl',
}

function Avatar({ name, imageUrl, size = 'md' }: AvatarProps) {
  const sizeClass = SIZE_CLASSES[size]

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${name} 프로필`}
        className={`${sizeClass} rounded-full object-cover`}
      />
    )
  }

  return (
    <div
      className={`
        ${sizeClass} rounded-full
        bg-purple-500 text-white
        flex items-center justify-center font-bold
      `}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default Avatar
