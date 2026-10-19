import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, FormEvent } from 'react'
import { COLLECTION_COLORS, STARTER_COLLECTIONS, validateCollection } from './library'
import type { AudioCollection } from './library'
import { Cover, Icon, formatCount, formatTime } from './ui'
import type { IconName } from './ui'
import './App.css'

type Section = 'home' | 'library' | 'favorites' | 'recent'
interface NowPlaying { collectionId: string; trackIndex: number }
interface BookProgress {
  trackIndex: number
  seconds: number
  updatedAt: number
  completed: number[]
}
type ProgressMap = Record<string, BookProgress>
interface CollectionForm {
  title: string
  author: string
  category: string
  color: string
  description: string
  artwork: string
  trackLines: string
}
const STORAGE_PREFIX = 'listenshelf-v3:'
const storageKey = (key: string) => STORAGE_PREFIX + key

function readStorage<T>(name: string, fallback: T): T {
  try {
    const value = localStorage.getItem(storageKey(name))
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}
function saveStorage(name: string, value: unknown) {
  try {
    localStorage.setItem(storageKey(name), JSON.stringify(value))
  } catch {
    // Storage may be disabled or full; the current session will still work.
  }
}

function restoreCollections(): AudioCollection[] {
  const entries = readStorage<unknown>('custom-collections', [])
  if (!Array.isArray(entries)) return []
  return entries.slice(0, 150).flatMap((raw) => {
    const candidate = validateCollection(raw)
    if (!candidate) return []
    const saved = raw as Record<string, unknown>
    const savedTracks = Array.isArray(saved.tracks) ? saved.tracks : []
    return [{
      ...candidate,
      id: typeof saved.id === 'string' && saved.id.startsWith('custom-')
        ? saved.id : 'custom-' + candidate.id,
      tracks: candidate.tracks.map((track, index) => {
        const value = savedTracks[index] as Record<string, unknown> | undefined
        return { ...track, id: typeof value?.id === 'string' ? value.id : track.id }
      }),
    }]
  })
}

const emptyForm: CollectionForm = {
  title: '', author: '', category: 'Audiobooks', color: 'violet',
  description: '', artwork: '', trackLines: '',
}

function App() {
  const [section, setSection] = useState<Section>('home')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sortOrder, setSortOrder] = useState<'featured' | 'title' | 'author'>('featured')
  const [favorites, setFavorites] = useState<string[]>(() => readStorage('favorites', []))
  const [customCollections, setCustomCollections] = useState<AudioCollection[]>(restoreCollections)
  const [progressMap, setProgressMap] = useState<ProgressMap>(() => readStorage('progress', {}))
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(() => readStorage<number>('speed', 1))
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [queueVisible, setQueueVisible] = useState(false)
  const [sleepUntil, setSleepUntil] = useState<number | null>(null)
  const [showManager, setShowManager] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CollectionForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [importError, setImportError] = useState('')
  const [importText, setImportText] = useState('')

  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef(progressMap)
  const playingRef = useRef<NowPlaying | null>(null)
  const wantsPlayback = useRef(false)
  const resumeOnLoadRef = useRef<number | null>(null)
  const lastSaveRef = useRef(0)
  const controlsRef = useRef({
    play: () => {}, pause: () => {}, next: () => {}, previous: () => {},
    seekBack: () => {}, seekForward: () => {},
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const collections = useMemo(
    () => [...STARTER_COLLECTIONS, ...customCollections],
    [customCollections],
  )
  const collectionsRef = useRef(collections)
  collectionsRef.current = collections

  const selected = selectedId ? collections.find((item) => item.id === selectedId) : null
  const activeBook = nowPlaying ? collections.find((item) => item.id === nowPlaying.collectionId) : null
  const activeTrack = activeBook && nowPlaying ? activeBook.tracks[nowPlaying.trackIndex] : null
  const latestProgress = useMemo(() =>
    collections
      .filter((book) => Boolean(progressMap[book.id]))
      .sort((a, b) => progressMap[b.id].updatedAt - progressMap[a.id].updatedAt),
    [collections, progressMap],
  )
  const featured = latestProgress.find((item) => item.id !== 'original-import') || collections[0]

  useEffect(() => saveStorage('favorites', favorites), [favorites])
  useEffect(() => saveStorage('progress', progressMap), [progressMap])
  useEffect(() => saveStorage('custom-collections', customCollections), [customCollections])
  useEffect(() => saveStorage('speed', speed), [speed])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 3800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (!sleepUntil) return
    const timer = window.setInterval(() => {
      if (Date.now() >= sleepUntil) {
        wantsPlayback.current = false
        audioRef.current?.pause()
        setSleepUntil(null)
        setToast('Sleep timer finished. Playback paused.')
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [sleepUntil])

  function storeProgress(bookId: string, trackIndex: number, seconds: number, completed = false) {
    const existing = progressRef.current[bookId]
    const completedTracks = existing?.completed ?? []
    const revised: BookProgress = {
      trackIndex,
      seconds: Number.isFinite(seconds) ? Math.max(0, seconds) : 0,
      updatedAt: Date.now(),
      completed: completed && !completedTracks.includes(trackIndex)
        ? [...completedTracks, trackIndex] : completedTracks,
    }
    const value = { ...progressRef.current, [bookId]: revised }
    progressRef.current = value
    setProgressMap(value)
  }

  function snapshotProgress() {
    const playing = playingRef.current
    const audio = audioRef.current
    if (playing && audio && Number.isFinite(audio.currentTime) && audio.currentTime > 0) {
      storeProgress(playing.collectionId, playing.trackIndex, audio.currentTime)
    }
  }

  useEffect(() => {
    const save = () => {
      const playing = playingRef.current
      const audio = audioRef.current
      if (playing && audio && Number.isFinite(audio.currentTime)) {
        const existing = progressRef.current[playing.collectionId]
        const updated = {
          ...progressRef.current,
          [playing.collectionId]: {
            trackIndex: playing.trackIndex,
            seconds: audio.currentTime,
            updatedAt: Date.now(),
            completed: existing?.completed ?? [],
          },
        }
        progressRef.current = updated
        saveStorage('progress', updated)
      }
    }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', save)
    return () => {
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', save)
    }
  }, [])

  function play() {
    const audio = audioRef.current
    if (!audio) return
    if (!playingRef.current) {
      startTrack(featured, 0, true)
      return
    }
    wantsPlayback.current = true
    setError(null)
    const result = audio.play()
    void result.catch((cause: unknown) => {
      if (cause instanceof Error && cause.name === 'AbortError') return
      wantsPlayback.current = false
      setIsLoading(false)
      setIsPlaying(false)
      setError('Playback was blocked or this recording could not load. Tap Play to retry.')
      console.error('Audio playback failed', cause)
    })
  }

  function pause() {
    wantsPlayback.current = false
    audioRef.current?.pause()
    setIsPlaying(false)
  }

  function startTrack(book: AudioCollection, index: number, autoplay = true, resume = false) {
    const track = book.tracks[index]
    const audio = audioRef.current
    if (!track || !audio) return

    if (playingRef.current?.collectionId === book.id && playingRef.current.trackIndex === index) {
      if (autoplay) play()
      return
    }
    snapshotProgress()
    audio.pause()
    wantsPlayback.current = autoplay
    playingRef.current = { collectionId: book.id, trackIndex: index }
    setNowPlaying({ collectionId: book.id, trackIndex: index })
    setCurrentTime(0)
    setDuration(0)
    lastSaveRef.current = 0
    setError(null)
    setIsLoading(true)
    const saved = progressRef.current[book.id]
    resumeOnLoadRef.current = resume && saved?.trackIndex === index && saved.seconds > 2
      ? saved.seconds : null
    audio.src = track.url
    audio.playbackRate = speed
    audio.load()
    storeProgress(book.id, index, resumeOnLoadRef.current ?? 0)
    if (autoplay) {
      // The play() call stays in the same user gesture as the tapped chapter or button.
      const result = audio.play()
      void result.catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === 'AbortError') return
        wantsPlayback.current = false
        setIsPlaying(false)
        setIsLoading(false)
        setError('This recording could not start automatically. Tap Play to retry.')
        console.error('Unable to start track', cause)
      })
    }
  }

  function startBook(book: AudioCollection) {
    const saved = progressRef.current[book.id]
    const index = saved && saved.trackIndex < book.tracks.length
      ? saved.trackIndex : 0
    startTrack(book, index, true, true)
  }

  function next() {
    const playing = playingRef.current
    if (!playing) return
    const book = collectionsRef.current.find((item) => item.id === playing.collectionId)
    if (!book || playing.trackIndex >= book.tracks.length - 1) return
    startTrack(book, playing.trackIndex + 1, wantsPlayback.current)
  }

  function previous() {
    const playing = playingRef.current
    const audio = audioRef.current
    if (!playing || !audio) return
    if (audio.currentTime > 4) {
      audio.currentTime = 0
      return
    }
    const book = collectionsRef.current.find((item) => item.id === playing.collectionId)
    if (book && playing.trackIndex > 0) startTrack(book, playing.trackIndex - 1, wantsPlayback.current)
  }

  function seekBy(seconds: number) {
    const audio = audioRef.current
    if (!audio) return
    const max = Number.isFinite(audio.duration) ? audio.duration : Infinity
    audio.currentTime = Math.max(0, Math.min(max, audio.currentTime + seconds))
    snapshotProgress()
  }

  function seekTo(seconds: number) {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(seconds)) return
    audio.currentTime = seconds
    setCurrentTime(seconds)
    snapshotProgress()
  }

  controlsRef.current = {
    play, pause, next, previous,
    seekBack: () => seekBy(-15),
    seekForward: () => seekBy(30),
  }

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const handlers: Array<[MediaSessionAction, () => void]> = [
      ['play', () => controlsRef.current.play()],
      ['pause', () => controlsRef.current.pause()],
      ['nexttrack', () => controlsRef.current.next()],
      ['previoustrack', () => controlsRef.current.previous()],
      ['seekbackward', () => controlsRef.current.seekBack()],
      ['seekforward', () => controlsRef.current.seekForward()],
    ]
    for (const [name, handler] of handlers) {
      try { navigator.mediaSession.setActionHandler(name, handler) }
      catch { /* Not supported on this platform */ }
    }
    return () => {
      for (const [name] of handlers) {
        try { navigator.mediaSession.setActionHandler(name, null) }
        catch { /* Not supported */ }
      }
    }
  }, [])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !activeBook || !activeTrack) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: activeTrack.title,
      artist: activeBook.author,
      album: activeBook.title,
      artwork: [{
        src: new URL('favicon.svg', window.location.origin + import.meta.env.BASE_URL).toString(),
        sizes: 'any',
        type: 'image/svg+xml',
      }],
    })
  }, [activeBook, activeTrack])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        position: Math.min(audio.currentTime, audio.duration),
        playbackRate: audio.playbackRate,
      })
    } catch { /* Some iOS versions omit position-state support */ }
  }, [isPlaying, duration, currentTime, speed])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (/INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.isContentEditable ||
          showManager || event.altKey || event.metaKey || event.ctrlKey) return
      if (event.code === 'Space' || event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (audioRef.current?.paused) controlsRef.current.play()
        else controlsRef.current.pause()
      } else if (event.key === 'ArrowLeft') controlsRef.current.seekBack()
      else if (event.key === 'ArrowRight') controlsRef.current.seekForward()
      else if (event.key === 'Escape') {
        setPlayerOpen(false)
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showManager])

  function handleTimeUpdate() {
    const audio = audioRef.current
    const playing = playingRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
    if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    if (playing && audio.currentTime - lastSaveRef.current > 4) {
      lastSaveRef.current = audio.currentTime
      storeProgress(playing.collectionId, playing.trackIndex, audio.currentTime)
    }
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current
    if (!audio) return
    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    if (resumeOnLoadRef.current !== null) {
      const maximum = Number.isFinite(audio.duration) ? Math.max(0, audio.duration - 2) : resumeOnLoadRef.current
      try { audio.currentTime = Math.min(resumeOnLoadRef.current, maximum) }
      catch { /* Some streams don't support seeking until buffered */ }
      resumeOnLoadRef.current = null
    }
    setIsLoading(false)
  }

  function handleEnded() {
    const playing = playingRef.current
    if (!playing) return
    const book = collectionsRef.current.find((item) => item.id === playing.collectionId)
    if (!book) return
    storeProgress(book.id, playing.trackIndex, duration, true)
    if (playing.trackIndex < book.tracks.length - 1) {
      // Next track stays within the current book. Never jump into a different collection.
      startTrack(book, playing.trackIndex + 1, true)
    } else {
      wantsPlayback.current = false
      setIsPlaying(false)
      setToast('You finished this collection!')
    }
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => current.includes(id)
      ? current.filter((value) => value !== id) : [...current, id])
  }

  function navigate(target: Section) {
    setSection(target)
    setSelectedId(null)
    setCategory('All')
    setQuery('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openBook(book: AudioCollection) {
    setSelectedId(book.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const categories = useMemo(
    () => ['All', ...new Set(collections.map((item) => item.category))],
    [collections],
  )

  const shownCollections = useMemo(() => {
    let matches = collections.filter((book) =>
      [book.title, book.author, book.category, book.description, ...book.tracks.map((t) => t.title)]
        .some((value) => value.toLowerCase().includes(query.toLowerCase().trim())),
    )
    if (category !== 'All') matches = matches.filter((book) => book.category === category)
    if (section === 'favorites') matches = matches.filter((book) => favorites.includes(book.id))
    if (section === 'recent') matches = matches.filter((book) => Boolean(progressMap[book.id]))
    if (section === 'recent') matches.sort((a, b) =>
      progressMap[b.id].updatedAt - progressMap[a.id].updatedAt)
    else if (sortOrder === 'title') matches.sort((a, b) => a.title.localeCompare(b.title))
    else if (sortOrder === 'author') matches.sort((a, b) => a.author.localeCompare(b.author))
    return matches
  }, [category, collections, favorites, progressMap, query, section, sortOrder])

  function openCreateManager() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
    setImportError('')
    setImportText('')
    setShowManager(true)
  }

  function openEditManager(book: AudioCollection) {
    if (!book.custom) return
    setEditingId(book.id)
    setForm({
      title: book.title,
      author: book.author,
      category: book.category,
      color: book.color,
      description: book.description,
      artwork: book.artwork ?? '',
      trackLines: book.tracks.map((track) => `${track.title} | ${track.url}`).join('\n'),
    })
    setFormError('')
    setShowManager(true)
  }

  function saveCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const tracks = form.trackLines.split('\n').map((line) => line.trim()).filter(Boolean)
    const parsed = tracks.map((line) => {
      const pivot = line.indexOf('|')
      if (pivot < 0) return { title: '', url: '' }
      return { title: line.slice(0, pivot).trim(), url: line.slice(pivot + 1).trim() }
    })
    const result = validateCollection({ ...form, tracks: parsed })
    if (!result) {
      setFormError('Add a title and at least one HTTPS recording, one per line as: Chapter title | https://example.com/audio.mp3')
      return
    }
    if (editingId) {
      const original = customCollections.find((item) => item.id === editingId)
      if (!original) return
      const retainedTracks = result.tracks.map((track, index) => {
        const existing = original.tracks[index]
        return existing && existing.url === track.url ? { ...track, id: existing.id } : track
      })
      setCustomCollections((items) => items.map((item) => item.id === editingId
        ? { ...result, id: editingId, tracks: retainedTracks } : item))
      setToast('Collection updated.')
    } else {
      setCustomCollections((items) => [...items, { ...result, id: 'custom-' + result.id }])
      setToast('Collection added to your library.')
    }
    setShowManager(false)
  }

  function removeCollection(book: AudioCollection) {
    if (!book.custom) return
    if (!window.confirm(`Remove "${book.title}" from your library on this device?`)) return
    setCustomCollections((items) => items.filter((item) => item.id !== book.id))
    if (selectedId === book.id) setSelectedId(null)
    if (playingRef.current?.collectionId === book.id) {
      pause()
      audioRef.current?.removeAttribute('src')
      playingRef.current = null
      setNowPlaying(null)
    }
    setToast('Collection removed from this device.')
  }

  function exportCollections() {
    if (!customCollections.length) {
      setToast('Add a personal collection before exporting.')
      return
    }
    const file = new Blob([JSON.stringify({ version: 1, collections: customCollections }, null, 2)],
      { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = 'listenshelf-library.json'
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function importCollections(raw: string) {
    try {
      const parsed: unknown = JSON.parse(raw)
      const entries = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && 'collections' in parsed
          ? (parsed as { collections: unknown }).collections : [parsed]
      if (!Array.isArray(entries) || entries.length === 0 || entries.length > 150) throw Error('Invalid collection count')
      const valid = entries.map(validateCollection)
      if (valid.some((entry) => !entry)) throw Error('Invalid format or recording URL')
      const additions = (valid as AudioCollection[]).map((book) => ({
        ...book, id: 'custom-' + book.id,
      }))
      setCustomCollections((items) => [...items, ...additions].slice(0, 150))
      setImportError('')
      setImportText('')
      setShowManager(false)
      setToast(`Imported ${formatCount(additions.length, 'collection')}.`)
    } catch {
      setImportError('Could not import that JSON file. Check the format and make sure each recording has an HTTPS link.')
    }
  }

  function fileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5_000_000) {
      setImportError('Please select a JSON file smaller than 5 MB.')
      return
    }
    void file.text().then(importCollections).catch(() => setImportError('The file could not be read.'))
    event.target.value = ''
  }

  const navItems: { key: Section; title: string; icon: IconName }[] = [
    { key: 'home', title: 'Home', icon: 'grid' },
    { key: 'library', title: 'Library', icon: 'books' },
    { key: 'favorites', title: 'Favorites', icon: 'heart' },
    { key: 'recent', title: 'Recent', icon: 'clock' },
  ]

  function bookCard(book: AudioCollection) {
    const saved = progressMap[book.id]
    const percent = saved && book.tracks.length > 0
      ? Math.round(((saved.completed.length + (saved.seconds > 10 && !saved.completed.includes(saved.trackIndex) ? 0.3 : 0)) / book.tracks.length) * 100) : 0
    return (
      <article className="book-card" key={book.id}>
        <button className="book-card__open" onClick={() => openBook(book)}
          aria-label={`Open ${book.title} by ${book.author}`}>
          <Cover collection={book} />
          {saved && <span className="book-card__progress" aria-label={`Approximately ${percent}% completed`}>
            <span style={{ width: `${percent}%` }} />
          </span>}
        </button>
        <div className="book-card__info">
          <button className="book-card__title" onClick={() => openBook(book)}>{book.title}</button>
          <span className="book-card__author">{book.author}</span>
          <div className="book-card__bottom">
            <span>{formatCount(book.tracks.length, 'recording')}</span>
            <button className={`icon-btn heart-btn ${favorites.includes(book.id) ? 'is-favorite' : ''}`}
              onClick={() => toggleFavorite(book.id)}
              aria-label={favorites.includes(book.id) ? `Remove ${book.title} from favorites` : `Favorite ${book.title}`}
              title={favorites.includes(book.id) ? 'Remove favorite' : 'Add to favorites'}>
              <Icon name="heart" size={18} />
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <button className="brand" onClick={() => navigate('home')}>
          <span className="brand__symbol"><Icon name="headphones" size={23} /></span>
          <span>Listen<span className="brand__highlight">Shelf</span><small>YOUR AUDIO LIBRARY</small></span>
        </button>
        <div className="sidebar__label">EXPLORE</div>
        <nav className="side-nav">
          {navItems.map((item) => (
            <button key={item.key}
              className={`side-nav__item ${section === item.key && !selected ? 'is-active' : ''}`}
              onClick={() => navigate(item.key)}>
              <Icon name={item.icon} size={19} /><span>{item.title}</span>
              {item.key === 'favorites' && favorites.length > 0 && <em>{favorites.length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar__divider" />
        <div className="sidebar__label">YOUR COLLECTION</div>
        <button className="side-nav__item side-nav__add" onClick={openCreateManager}>
          <Icon name="plus" size={19} /><span>Add a collection</span>
        </button>
        <div className="sidebar__spacer" />
        <div className="sidebar__note">
          <span className="sidebar__note-icon"><Icon name="sparkle" size={20}/></span>
          <strong>Make room for stories.</strong>
          <p>Your personal shelf, always a tap away.</p>
          <button onClick={() => navigate('library')}>Browse your library <Icon name="chevronRight" size={14}/></button>
        </div>
        <span className="sidebar__copyright">LISTENSHELF · V2</span>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand__symbol"><Icon name="headphones" size={21}/></span>
            <span>Listen<span className="brand__highlight">Shelf</span></span>
          </div>
          <div className="topbar__eyebrow">YOUR LISTENING SPACE <span className="topbar__dot">✦</span> CURATED FOR YOU</div>
          <div className="topbar__right">
            <label className="search-field">
              <Icon name="search" size={19} />
              <input type="search" value={query} onChange={(event) => {
                setQuery(event.target.value)
                if (selectedId) setSelectedId(null)
              }} placeholder="Search titles, authors, chapters..." aria-label="Search library"/>
              {query && <button onClick={() => setQuery('')} aria-label="Clear search"><Icon name="close" size={14}/></button>}
              <span className="search-field__shortcut">⌘ K</span>
            </label>
            <button className="topbar__add icon-btn" onClick={openCreateManager} title="Add collection" aria-label="Add collection">
              <Icon name="plus" size={22}/>
            </button>
          </div>
        </header>

        <main className="main-content">
          {selected ? (
            <div className="detail-page">
              <button className="back-link" onClick={() => setSelectedId(null)}>
                <Icon name="arrowLeft" size={18}/> Back to library
              </button>
              <div className="detail-hero">
                <Cover collection={selected} size="detail"/>
                <div className="detail-hero__content">
                  <div className="eyebrow"><span className="eyebrow__line"/> {selected.label || 'AUDIO COLLECTION'}</div>
                  <h1>{selected.title}</h1>
                  <p className="detail-hero__author">by {selected.author}</p>
                  <p className="detail-hero__description">{selected.description || 'A collection of audio recordings.'}</p>
                  <div className="detail-hero__stats">
                    <span><Icon name="list" size={17}/> {formatCount(selected.tracks.length, 'recording')}</span>
                    <span><Icon name="headphones" size={17}/> {selected.category}</span>
                    {progressMap[selected.id] && <span><Icon name="clock" size={17}/> In progress</span>}
                  </div>
                  <div className="detail-actions">
                    <button className="button button--primary" onClick={() => startBook(selected)}>
                      <Icon name="play" size={17}/> {progressMap[selected.id] ? 'Continue listening' : 'Start listening'}
                    </button>
                    <button className={`button button--outline ${favorites.includes(selected.id) ? 'button--favorited' : ''}`}
                      onClick={() => toggleFavorite(selected.id)}>
                      <Icon name="heart" size={18}/> {favorites.includes(selected.id) ? 'Favorited' : 'Add to favorites'}
                    </button>
                    {selected.custom && <button className="button button--quiet" onClick={() => openEditManager(selected)}>
                      <Icon name="edit" size={16}/> Edit
                    </button>}
                  </div>
                </div>
              </div>
              <div className="track-section">
                <div className="section-heading section-heading--tracks">
                  <div><span className="eyebrow eyebrow--muted">THE RECORDINGS</span><h2>Track list</h2></div>
                  <span className="small-pill">{formatCount(selected.tracks.length, 'chapter', 'chapters')}</span>
                </div>
                <div className="track-list">
                  {selected.tracks.map((track, index) => {
                    const active = nowPlaying?.collectionId === selected.id && nowPlaying.trackIndex === index
                    const finished = progressMap[selected.id]?.completed.includes(index)
                    return (
                      <button key={track.id} className={`track-row ${active ? 'is-active' : ''}`}
                        onClick={() => startTrack(selected, index, true, false)}
                        aria-label={`Play ${track.title}`}>
                        <span className="track-row__number">{active && isPlaying ? <span className="playing-bars"><i/><i/><i/></span> : String(index + 1).padStart(2, '0')}</span>
                        <span className="track-row__text">
                          <strong>{track.title}</strong>
                          <small>{active ? (isPlaying ? 'Now playing' : 'Ready to play') : finished ? 'Finished' : 'Recording'}</small>
                        </span>
                        {finished && <Icon name="checkCircle" size={17} className="track-row__check"/>}
                        <span className="track-row__play"><Icon name={active && isPlaying ? 'pause' : 'play'} size={16}/></span>
                      </button>
                    )
                  })}
                </div>
                {selected.sourceUrl && <p className="attribution">Public-domain recording information: <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">View source <Icon name="link" size={13}/></a></p>}
                {selected.custom && <div className="detail-manage"><button onClick={() => openEditManager(selected)}><Icon name="edit" size={16}/> Edit collection</button><button className="danger-text" onClick={() => removeCollection(selected)}><Icon name="trash" size={16}/> Remove</button></div>}
              </div>
            </div>
          ) : (
            <div className="browse-page">
              {section === 'home' && !query && (
                <>
                  <div className="page-heading page-heading--home">
                    <div className="eyebrow"><span className="eyebrow__line"/> YOUR PERSONAL AUDIO SPACE</div>
                    <h1>A world of stories.<br/><em>All yours to explore.</em></h1>
                    <p>Find your next great listen, or pick up right where you left off.</p>
                  </div>
                  <div className="featured-panel">
                    <div className="featured-panel__copy">
                      <div className="featured-panel__label"><Icon name="sparkle" size={15}/> {latestProgress.length ? 'PICK UP WHERE YOU LEFT OFF' : 'YOUR NEXT LISTEN'}</div>
                      <h2>{featured.title}</h2>
                      <p className="featured-panel__author">{featured.author}</p>
                      <p className="featured-panel__description">{featured.description}</p>
                      <button className="button button--primary" onClick={() => startBook(featured)}>
                        <Icon name="play" size={17}/> {progressMap[featured.id] ? 'Resume listening' : 'Start listening'}
                      </button>
                      <button className="featured-panel__details" onClick={() => openBook(featured)}>
                        View collection <Icon name="chevronRight" size={16}/>
                      </button>
                    </div>
                    <div className="featured-panel__art"><Cover collection={featured} size="feature"/></div>
                    <div className="featured-panel__decoration" aria-hidden="true">LISTEN · DISCOVER · REPEAT</div>
                  </div>
                  {latestProgress.length > 0 && (
                    <section className="shelf-section shelf-section--recent">
                      <div className="section-heading">
                        <div><span className="eyebrow eyebrow--muted">RIGHT WHERE YOU LEFT OFF</span><h2>Continue listening</h2></div>
                        <button className="text-link" onClick={() => navigate('recent')}>See all <Icon name="chevronRight" size={16}/></button>
                      </div>
                      <div className="continue-row">
                        {latestProgress.slice(0, 3).map((book) => {
                          const saved = progressMap[book.id]
                          return (
                            <button key={book.id} className="continue-card" onClick={() => startBook(book)}>
                              <Cover collection={book} size="mini"/>
                              <span className="continue-card__text"><strong>{book.title}</strong><small>Recording {saved.trackIndex + 1} of {book.tracks.length}</small><span className="continue-card__bar"><span style={{ width: `${Math.max(7, Math.round(100 * (saved.trackIndex + 1) / book.tracks.length))}%` }}/></span></span>
                              <span className="continue-card__button"><Icon name="play" size={16}/></span>
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )}
                  <section className="shelf-section">
                    <div className="section-heading">
                      <div><span className="eyebrow eyebrow--muted">HANDPICKED FOR YOUR SHELF</span><h2>Explore the library</h2></div>
                      <button className="text-link" onClick={() => navigate('library')}>View all <Icon name="chevronRight" size={16}/></button>
                    </div>
                    <div className="book-grid">{collections.slice(0, 5).map(bookCard)}</div>
                  </section>
                  <div className="library-banner">
                    <div><span className="eyebrow eyebrow--muted">GROW YOUR COLLECTION</span><h3>Your shelf, your stories.</h3><p>Add your own audio collections with chapter links. Everything stays organized in one place.</p></div>
                    <button className="button button--outline" onClick={openCreateManager}><Icon name="plus" size={17}/> Add a collection</button>
                  </div>
                </>
              )}
              {(section !== 'home' || query) && (
                <>
                  <div className="page-heading page-heading--subpage">
                    <div className="eyebrow"><span className="eyebrow__line"/> LISTENSHELF COLLECTIONS</div>
                    <h1>{query ? 'Search your library' : section === 'favorites' ? 'Your favorites' : section === 'recent' ? 'Recently played' : 'The library'}<span className="heading-period">.</span></h1>
                    <p>{query ? `Results for “${query}”` : section === 'favorites' ? 'The listens you keep coming back to.' : section === 'recent' ? 'All your in-progress and recently played collections.' : 'Everything you love to listen to, in one beautiful place.'}</p>
                  </div>
                  <div className="library-toolbar">
                    <div className="category-pills" role="group" aria-label="Filter by category">
                      {categories.map((value) => <button key={value} className={`category-pill ${category === value ? 'is-selected' : ''}`}
                        onClick={() => setCategory(value)}>{value}</button>)}
                    </div>
                    <label className="sort-select">
                      <Icon name="sort" size={17}/>
                      <select aria-label="Sort collections" value={sortOrder}
                        onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}>
                        <option value="featured">Featured</option><option value="title">Title A–Z</option><option value="author">Author A–Z</option>
                      </select>
                    </label>
                  </div>
                  <div className="shelf-count">{formatCount(shownCollections.length, 'collection')} on this shelf</div>
                  {shownCollections.length ? <div className="book-grid book-grid--all">{shownCollections.map(bookCard)}</div>
                    : <div className="empty-state"><span className="empty-state__icon"><Icon name={section === 'favorites' ? 'heart' : 'search'} size={30}/></span><h2>Nothing on this shelf yet</h2><p>{section === 'favorites' ? 'Tap the heart on a collection to save it here.' : 'Try a different search or category, or add your own collection.'}</p><button className="button button--outline" onClick={() => {setQuery('');setCategory('All');setSection('library')}}>Browse all collections</button></div>}
                  <div className="all-library-actions"><button onClick={openCreateManager}><Icon name="plus" size={17}/> Add your own collection</button></div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {nowPlaying && activeBook && activeTrack && !playerOpen && (
        <div className="mini-player" role="region" aria-label="Audio player">
          <div className="mini-player__progress" style={{ width: `${duration ? Math.max(0, Math.min(100, currentTime / duration * 100)) : 0}%` }}/>
          <button className="mini-player__track" onClick={() => setPlayerOpen(true)} aria-label="Open full audio player">
            <Cover collection={activeBook} size="mini" />
            <span className="mini-player__text"><strong>{activeTrack.title}</strong><small>{activeBook.title} · {activeBook.author}</small></span>
          </button>
          <div className="mini-player__controls">
            <button className="mini-player__previous icon-btn" onClick={previous} aria-label="Previous recording"><Icon name="previous" size={22}/></button>
            <button className="mini-player__play" onClick={isPlaying ? pause : play} aria-label={isPlaying ? 'Pause' : 'Play'}><Icon name={isPlaying ? 'pause' : 'play'} size={22}/></button>
            <button className="mini-player__next icon-btn" onClick={next} aria-label="Next recording"><Icon name="next" size={22}/></button>
            <button className="mini-player__expand icon-btn" onClick={() => setPlayerOpen(true)} aria-label="Expand player"><Icon name="chevronRight" size={21}/></button>
          </div>
        </div>
      )}

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <button key={item.key} className={`mobile-nav__item ${section === item.key && !selected ? 'is-active' : ''}`}
            onClick={() => navigate(item.key)}><Icon name={item.icon} size={21}/><span>{item.title}</span></button>
        ))}
      </nav>

      {error && <div className="audio-error" role="alert"><Icon name="info" size={19}/><span>{error}</span><button onClick={() => setError(null)} aria-label="Dismiss error"><Icon name="close" size={17}/></button></div>}
      {toast && <div className="toast" role="status"><Icon name="checkCircle" size={18}/>{toast}</div>}

      <audio ref={audioRef} preload="metadata" aria-hidden="true"
        onLoadStart={() => setIsLoading(true)}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlaying={() => { setIsPlaying(true);setIsLoading(false) }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          wantsPlayback.current = false
          setIsPlaying(false)
          setIsLoading(false)
          setError('This audio source is temporarily unavailable or cannot be played in this browser. You can try another recording.')
        }}
        onEnded={handleEnded}/>

      {playerOpen && activeBook && activeTrack && nowPlaying && (
        <div className="player-overlay" role="dialog" aria-modal="true" aria-label="Now playing">
          <div className="player-dialog">
            <div className="player-dialog__top"><button className="icon-btn" onClick={() => setPlayerOpen(false)} aria-label="Minimize player"><Icon name="chevronDown" size={25}/></button><span>NOW PLAYING</span><button className="icon-btn" onClick={() => {setPlayerOpen(false);openBook(activeBook)}} aria-label="Show collection"><Icon name="list" size={22}/></button></div>
            <div className="player-dialog__art"><Cover collection={activeBook} size="player"/></div>
            <div className="player-dialog__identity"><div><h2>{activeTrack.title}</h2><p>{activeBook.title} · {activeBook.author}</p></div><button className={`icon-btn heart-btn ${favorites.includes(activeBook.id) ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(activeBook.id)} aria-label="Toggle favorite"><Icon name="heart" size={23}/></button></div>
            <div className="player-dialog__progress"><input aria-label="Audio position" type="range" min="0" max={duration || 1} step="1" value={Math.min(currentTime, duration || 1)} onChange={(event) => seekTo(Number(event.target.value))} style={{ '--progress': `${duration ? (currentTime / duration * 100) : 0}%` } as CSSProperties}/><div><span>{formatTime(currentTime)}</span><span>{duration > 0 ? '-' + formatTime(Math.max(0, duration - currentTime)) : isLoading ? 'Loading…' : '0:00'}</span></div></div>
            <div className="player-dialog__controls">
              <button onClick={previous} aria-label="Previous recording" title="Previous recording"><Icon name="previous" size={26}/></button>
              <button onClick={() => seekBy(-15)} aria-label="Skip back 15 seconds"><Icon name="back15" size={32}/></button>
              <button className="player-dialog__mainplay" onClick={isPlaying ? pause : play} aria-label={isPlaying ? 'Pause' : 'Play'}><Icon name={isPlaying ? 'pause' : 'play'} size={32}/></button>
              <button onClick={() => seekBy(30)} aria-label="Skip forward 30 seconds"><Icon name="forward30" size={32}/></button>
              <button onClick={next} aria-label="Next recording" title="Next recording"><Icon name="next" size={26}/></button>
            </div>
            <div className="player-dialog__extras">
              <label className="player-dialog__speed"><span>SPEED</span><select aria-label="Playback speed" value={speed} onChange={(event) => {const rate = Number(event.target.value);setSpeed(rate);if (audioRef.current) audioRef.current.playbackRate = rate}}><option value="0.75">0.75×</option><option value="1">1.0×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="1.75">1.75×</option><option value="2">2.0×</option></select></label>
              <label className="player-dialog__sleep"><Icon name="moon" size={19}/><select aria-label="Sleep timer" value={sleepUntil ? 'on' : 'off'} onChange={(event) => {const option=event.target.value;if(option==='off'){setSleepUntil(null);return}setSleepUntil(Date.now() + Number(option)*60_000);setToast(`Sleep timer set for ${option} minutes.`)}}><option value={sleepUntil ? 'on' : 'off'}>{sleepUntil ? 'Timer on' : 'Sleep timer'}</option><option value="off">Off</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">60 min</option></select></label>
              <button onClick={() => setQueueVisible((value) => !value)} aria-expanded={queueVisible}><Icon name="list" size={19}/> {queueVisible ? 'Hide tracks' : 'Up next'}</button>
            </div>
            {queueVisible && <div className="player-dialog__queue"><div className="player-dialog__queue-header">UP NEXT <span>{formatCount(activeBook.tracks.length, 'track')}</span></div>{activeBook.tracks.map((track, index) => <button key={track.id} className={index === nowPlaying.trackIndex ? 'is-active' : ''} onClick={() => startTrack(activeBook, index, true)}><span>{String(index+1).padStart(2,'0')}</span><strong>{track.title}</strong>{index === nowPlaying.trackIndex && <Icon name="volume" size={16}/>}</button>)}</div>}
          </div>
        </div>
      )}

      {showManager && (
        <div className="modal-backdrop" onClick={() => setShowManager(false)}>
          <section className="manager-modal" role="dialog" aria-modal="true" aria-label="Manage your audio library" onClick={(event) => event.stopPropagation()}>
            <div className="manager-modal__header"><div><span className="eyebrow eyebrow--muted">MAKE IT YOURS</span><h2>{editingId ? 'Edit collection' : 'Add a collection'}</h2><p>Create your own shelf using direct HTTPS audio links.</p></div><button className="icon-btn" onClick={() => setShowManager(false)} aria-label="Close"><Icon name="close" size={22}/></button></div>
            <form onSubmit={saveCollection}>
              <div className="form-grid">
                <label>Collection title <input required maxLength={150} value={form.title} placeholder="e.g. My favorite audiobook" onChange={(event) => setForm({...form,title:event.target.value})}/></label>
                <label>Author / Speaker <input maxLength={150} value={form.author} placeholder="Author or narrator" onChange={(event) => setForm({...form,author:event.target.value})}/></label>
                <label>Category <input maxLength={40} value={form.category} placeholder="Audiobooks" onChange={(event) => setForm({...form,category:event.target.value})}/></label>
                <label>Cover style <select value={form.color} onChange={(event) => setForm({...form,color:event.target.value})}>{COLLECTION_COLORS.map((color) => <option key={color} value={color}>{color[0].toUpperCase()+color.slice(1)}</option>)}</select></label>
              </div>
              <label>Description <textarea rows={2} maxLength={600} value={form.description} placeholder="What is this collection about?" onChange={(event) => setForm({...form,description:event.target.value})}/></label>
              <label>Cover image URL <span className="optional">(optional, HTTPS)</span> <input value={form.artwork} type="url" placeholder="https://example.com/cover.jpg" onChange={(event) => setForm({...form,artwork:event.target.value})}/></label>
              <label>Recordings <span className="form-hint">One per line: Chapter title | https://example.com/file.mp3</span><textarea required className="tracks-textarea" rows={6} value={form.trackLines} spellCheck={false} placeholder={'Chapter 1 | https://example.com/part1.mp3\nChapter 2 | https://example.com/part2.mp3'} onChange={(event) => setForm({...form,trackLines:event.target.value})}/></label>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="manager-modal__actions"><button type="button" className="button button--quiet" onClick={() => setShowManager(false)}>Cancel</button><button className="button button--primary" type="submit"><Icon name="check" size={17}/>{editingId ? 'Save changes' : 'Add to library'}</button></div>
            </form>
            {!editingId && <div className="import-panel">
              <div><h3>Import or back up your library</h3><p>Move your personal collections between devices with a JSON file. This is a browser-only library; there is no account sync.</p></div>
              <div className="import-panel__buttons"><button onClick={() => fileInputRef.current?.click()}><Icon name="upload" size={17}/> Import JSON</button><button onClick={exportCollections}><Icon name="download" size={17}/> Export mine</button></div>
              <input type="file" accept="application/json,.json" ref={fileInputRef} onChange={fileChosen} hidden/>
              <details className="import-panel__paste"><summary>Paste JSON instead</summary><textarea rows={3} spellCheck={false} placeholder='{"collections":[{"title":"...","author":"...","tracks":[{"title":"Chapter 1","url":"https://..."}]}]}' value={importText} onChange={(event) => setImportText(event.target.value)}/><button onClick={() => importCollections(importText)} disabled={!importText.trim()}>Import pasted JSON</button></details>
              {importError && <p className="form-error" role="alert">{importError}</p>}
            </div>}
          </section>
        </div>
      )}
    </div>
  )
}

export default App
