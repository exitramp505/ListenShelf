import type { ReactNode } from 'react'
import type { AudioCollection } from './library'

export type IconName =
  | 'play' | 'pause' | 'next' | 'previous' | 'back15' | 'forward30'
  | 'headphones' | 'books' | 'grid' | 'heart' | 'search' | 'plus'
  | 'arrowLeft' | 'chevronRight' | 'chevronDown' | 'close'
  | 'clock' | 'check' | 'more' | 'settings' | 'list' | 'sparkle'
  | 'upload' | 'download' | 'trash' | 'edit' | 'volume'
  | 'moon' | 'bookmark' | 'menu' | 'info' | 'checkCircle'
  | 'sort' | 'link' | 'arrowUp' | 'music' | 'pauseCircle'

const paths: Record<IconName, ReactNode> = {
  play: <path d="m8 5 12 7-12 7V5Z" fill="currentColor" stroke="none" />,
  pause: <><rect x="6.5" y="5" width="4" height="14" rx="1.3" fill="currentColor" stroke="none" /><rect x="13.5" y="5" width="4" height="14" rx="1.3" fill="currentColor" stroke="none" /></>,
  next: <><path d="m5 5 10 7-10 7V5Z" fill="currentColor" stroke="none" /><path d="M18 5v14" /></>,
  previous: <><path d="m19 5-10 7 10 7V5Z" fill="currentColor" stroke="none" /><path d="M6 5v14" /></>,
  back15: <><path d="M4.6 8a8 8 0 1 1-1 6"/><path d="M4 3v5h5"/><text x="12" y="15.1" fontSize="6.5" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="700">15</text></>,
  forward30: <><path d="M19.4 8a8 8 0 1 0 1 6"/><path d="M20 3v5h-5"/><text x="12" y="15.1" fontSize="6.5" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="700">30</text></>,
  headphones: <><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="7" rx="2"/><rect x="17" y="13" width="4" height="7" rx="2"/></>,
  books: <><path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5Z"/><path d="M4 20a2 2 0 0 1 2-2h13v3H6a2 2 0 0 1-2-1Z"/><path d="M8 7h8M8 11h5"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  heart: <path d="M20.8 8.5c0 5-8.8 11.3-8.8 11.3S3.2 13.5 3.2 8.5a4.5 4.5 0 0 1 8.8-1.2 4.5 4.5 0 0 1 8.8 1.2Z"/>,
  search: <><circle cx="10.7" cy="10.7" r="7"/><path d="m16 16 5 5"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  arrowLeft: <path d="m12 19-7-7 7-7M5 12h14"/>,
  chevronRight: <path d="m9 18 6-6-6-6"/>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  close: <path d="M5 5 19 19M19 5 5 19"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  more: <><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/></>,
  settings: <><path d="M10 3h4l.7 2.5 2.2 1.2 2.4-.7 2 3.5-1.7 1.8v2.4l1.7 1.8-2 3.5-2.4-.7-2.2 1.2L14 22h-4l-.7-2.5-2.2-1.2-2.4.7-2-3.5 1.7-1.8v-2.4L2.7 9.5l2-3.5 2.4.7 2.2-1.2L10 3Z"/><circle cx="12" cy="12.5" r="2.5"/></>,
  list: <><path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.02M4 12h.02M4 18h.02" strokeWidth="3" strokeLinecap="round"/></>,
  sparkle: <><path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2Z"/></>,
  upload: <><path d="M12 17V4m-4 4 4-4 4 4"/><path d="M4 16v4h16v-4"/></>,
  download: <><path d="M12 4v13m-4-4 4 4 4-4"/><path d="M4 17v4h16v-4"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/></>,
  edit: <><path d="M4 20h5l11-11-5-5L4 15v5ZM13 6l5 5"/></>,
  volume: <><path d="M4 10v4h4l5 4V6l-5 4H4ZM16 9c2 1 2 5 0 6M18 6c4 3 4 9 0 12"/></>,
  moon: <path d="M20 16.7A8.5 8.5 0 0 1 7.3 4 8.5 8.5 0 1 0 20 16.7Z"/>,
  bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z"/>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01" strokeWidth="2.5"/></>,
  checkCircle: <><circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/></>,
  sort: <path d="M7 3v18m-4-4 4 4 4-4M17 21V3m-4 4 4-4 4 4"/>,
  link: <><path d="M10 13a5 5 0 0 0 7.2 0l2-2a5 5 0 0 0-7-7l-2 2"/><path d="M14 11a5 5 0 0 0-7.2 0l-2 2a5 5 0 0 0 7 7l2-2"/></>,
  arrowUp: <path d="m5 12 7-7 7 7M12 5v14"/>,
  music: <><path d="M9 19V5l11-2v14"/><circle cx="6" cy="19" r="3"/><circle cx="17" cy="17" r="3"/></>,
  pauseCircle: <><circle cx="12" cy="12" r="9"/><path d="M9 8v8M15 8v8"/></>,
}

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
  className,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}

export function Cover({
  collection,
  size = 'card',
}: {
  collection: AudioCollection
  size?: 'card' | 'feature' | 'detail' | 'mini' | 'player'
}) {
  const coverImage = collection.artwork
  return (
    <div
      className={`book-cover book-cover--${collection.color} book-cover--${size} ${coverImage ? 'book-cover--image' : ''}`}
      style={coverImage ? { backgroundImage: `linear-gradient(0deg, rgba(9, 15, 27, .70), transparent 80%), url("${coverImage}")` } : undefined}
    >
      <div className="book-cover__glow" aria-hidden="true" />
      <div className="book-cover__orbit book-cover__orbit--one" aria-hidden="true" />
      <div className="book-cover__orbit book-cover__orbit--two" aria-hidden="true" />
      <span className="book-cover__kicker">{collection.category}</span>
      <div className="book-cover__text">
        <strong>{collection.title}</strong>
        <small>{collection.author}</small>
      </div>
      <span className="book-cover__mark" aria-hidden="true">LS / AUDIO</span>
    </div>
  )
}

export function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const total = Math.floor(value)
  const seconds = String(total % 60).padStart(2, '0')
  const minutes = Math.floor(total / 60)
  if (minutes >= 60) return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${seconds}`
  return `${minutes}:${seconds}`
}

export function formatCount(count: number, singular: string, plural = singular + 's'): string {
  return `${count} ${count === 1 ? singular : plural}`
}
