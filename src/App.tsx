import { useState, useEffect, useRef } from 'react'
import './App.css'

// Mock audio playlist with three recordings from the reference website
const MOCK_PLAYLIST = [
  {
    id: 'recording-1',
    title: 'Pierce-Turner_Diaries-START-ch6',
    artist: 'William L. Pierce',
    url: 'https://www.vanguardnewsnetwork.com/Massive/AudioBooks/Pierce-Turner_Diaries-START-ch6.mp3'
  },
  {
    id: 'recording-2',
    title: 'Pierce-Turner_Diaries-ch7-14',
    artist: 'William L. Pierce',
    url: 'https://www.vanguardnewsnetwork.com/Massive/AudioBooks/Pierce-Turner_Diaries-ch7-14.mp3'
  },
  {
    id: 'recording-3',
    title: 'Pierce-Turner_Diaries-ch15-22',
    artist: 'William L. Pierce',
    url: 'https://www.vanguardnewsnetwork.com/Massive/AudioBooks/Pierce-Turner_Diaries-ch15-22.mp3'
  }
]

function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const playlistRef = useRef(MOCK_PLAYLIST)
  // Track whether the user wants playback to continue across tracks.
  const playbackIntentRef = useRef(false)

  // Set up media session when supported
  useEffect(() => {
    if ('mediaSession' in navigator) {
      const updateMediaSessionMetadata = () => {
        const currentTrack = playlistRef.current[currentTrackIndex]
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: 'Audio Collection',
          artwork: [
            { src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%234b65d4"/><text x="50" y="50" font-family="Arial" font-size="16" text-anchor="middle" fill="white">Audio</text></svg>', sizes: '100x100', type: 'image/svg+xml' }
          ]
        })
      }

      updateMediaSessionMetadata()

      // Set up media session actions
      navigator.mediaSession.setActionHandler('play', () => {
        play()
      })

      navigator.mediaSession.setActionHandler('pause', () => {
        pause()
      })

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack()
      })

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        previousTrack()
      })

      return () => {
        // Reset media session handlers
        navigator.mediaSession.setActionHandler('play', null)
        navigator.mediaSession.setActionHandler('pause', null)
        navigator.mediaSession.setActionHandler('nexttrack', null)
        navigator.mediaSession.setActionHandler('previoustrack', null)
      }
    }
  }, [currentTrackIndex])

  const play = () => {
    const audio = audioRef.current
    if (!audio) return
    playbackIntentRef.current = true
    setError(null)
    void audio.play().catch((cause: unknown) => {
      // Switching tracks may cancel a pending play request; this is harmless.
      if (cause instanceof Error && cause.name === 'AbortError') return
      playbackIntentRef.current = false
      setIsPlaying(false)
      setError('Playback could not start. Tap Play to try again.')
      console.error('Audio play request failed:', cause)
    })
  }

  const pause = () => {
    playbackIntentRef.current = false
    audioRef.current?.pause()
  }

  const nextTrack = () => {
    if (currentTrackIndex < playlistRef.current.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1)
      setIsLoading(true)
      setError(null)
    }
  }

  const previousTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1)
      setIsLoading(true)
      setError(null)
    }
  }

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const handleCanPlay = () => {
    setIsLoading(false)
  }

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    playbackIntentRef.current = false
    setError('The recording could not be loaded. Try Play again or skip to the next one.')
    console.error('Audio playback error:', e)
    setIsPlaying(false)
    setIsLoading(false)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      setDuration(audioRef.current.duration || 0)
    }
  }

  const handleEnded = () => {
    if (currentTrackIndex < playlistRef.current.length - 1) {
      // Preserve the user's intent so the source-change effect starts the next track.
      playbackIntentRef.current = true
      setCurrentTrackIndex(currentTrackIndex + 1)
      setIsLoading(true)
      setError(null)
    } else {
      playbackIntentRef.current = false
      setIsPlaying(false)
    }
  }

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  // Switching a source does not automatically restart playback in browsers.
  // Reuse the SAME audio element and explicitly continue only when requested.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(0)
    setDuration(0)
    audio.load()
    if (playbackIntentRef.current) {
      void audio.play().catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === 'AbortError') return
        playbackIntentRef.current = false
        setIsPlaying(false)
        setIsLoading(false)
        setError('Automatic playback was blocked. Tap Play to continue.')
        console.error('Unable to advance playback:', cause)
      })
    }
  }, [currentTrackIndex])

  return (
    <div className="app">
      <h1>Audio Player</h1>
      
      <div className="player-container">
        <div className="track-info">
          <h2>{playlistRef.current[currentTrackIndex]?.title}</h2>
          <p>{playlistRef.current[currentTrackIndex]?.artist}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="progress-container">
          <span className="time-display">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
            className="progress-bar"
          />
          <span className="time-display">{formatTime(duration)}</span>
        </div>

        <div className="controls">
          <button onClick={previousTrack} disabled={currentTrackIndex === 0}>
            Previous
          </button>
          
          {isPlaying ? (
            <button onClick={pause}>Pause</button>
          ) : (
            <button onClick={play}>Play</button>
          )}
          
          <button onClick={nextTrack} disabled={currentTrackIndex === playlistRef.current.length - 1}>
            Next
          </button>
        </div>

        <div className="loading-indicator">
          {isLoading && <span>Loading track...</span>}
        </div>

        <audio
          ref={audioRef}
          src={playlistRef.current[currentTrackIndex]?.url}
          onCanPlay={handleCanPlay}
          onError={handleError}
          onTimeUpdate={handleTimeUpdate}
          onPlaying={() => { setIsPlaying(true); setIsLoading(false) }}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsLoading(true)}
          onEnded={handleEnded}
        />
      </div>
    </div>
  )
}

export default App