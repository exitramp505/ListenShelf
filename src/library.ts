// Public-domain starter catalog plus the URLs from the original proof of concept.
// Edit this file to curate bundled collections. Personal collections can be managed in the app.

export interface AudioTrack {
  id: string
  title: string
  url: string
}

export interface AudioCollection {
  id: string
  title: string
  author: string
  category: string
  description: string
  color: string
  label?: string
  sourceUrl?: string
  artwork?: string
  tracks: AudioTrack[]
  custom?: boolean
}

const two = (value: number) => String(value).padStart(2, '0')

const chapters = (
  count: number,
  id: string,
  urlFor: (number: number) => string,
  titleFor: (number: number) => string = (number) => `Chapter ${number}`,
): AudioTrack[] =>
  Array.from({ length: count }, (_, index) => {
    const number = index + 1
    return { id: `${id}-${number}`, title: titleFor(number), url: urlFor(number) }
  })

const archive = (collection: string, file: string) =>
  `https://archive.org/download/${collection}/${file}`

const aliceTitles = [
  'Down the Rabbit-Hole',
  'The Pool of Tears',
  'A Caucus-Race and a Long Tale',
  'The Rabbit Sends in a Little Bill',
  'Advice from a Caterpillar',
  'Pig and Pepper',
  'A Mad Tea-Party',
  "The Queen's Croquet-Ground",
  "The Mock Turtle's Story",
  'The Lobster Quadrille',
  'Who Stole the Tarts?',
  "Alice's Evidence",
]

const holmesTitles = [
  'A Scandal in Bohemia',
  'The Red-Headed League',
  'A Case of Identity',
  'The Boscombe Valley Mystery',
  'The Five Orange Pips',
  'The Man with the Twisted Lip',
  'The Adventure of the Blue Carbuncle',
  'The Adventure of the Speckled Band',
  "The Adventure of the Engineer's Thumb",
  'The Adventure of the Noble Bachelor',
  'The Adventure of the Beryl Coronet',
  'The Adventure of the Copper Beeches',
]

export const STARTER_COLLECTIONS: AudioCollection[] = [
  {
    id: 'alice-wonderland',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    category: 'Fiction',
    label: 'PUBLIC DOMAIN CLASSIC',
    description:
      'Follow Alice down the rabbit hole and into a world of strange creatures, unexpected encounters, and impossible adventures. A complete volunteer-read audiobook from LibriVox.',
    color: 'violet',
    sourceUrl: 'https://librivox.org/alices-adventures-in-wonderland-by-lewis-carroll/',
    tracks: chapters(
      12,
      'alice',
      (number) => archive('alice_in_wonderland_librivox', `wonderland_ch_${two(number)}.mp3`),
      (number) => `Chapter ${number} · ${aliceTitles[number - 1]}`,
    ),
  },
  {
    id: 'sherlock-holmes',
    title: 'The Adventures of Sherlock Holmes',
    author: 'Arthur Conan Doyle',
    category: 'Mystery',
    label: 'DETECTIVE FICTION',
    description:
      'Twelve classic mysteries with Sherlock Holmes and Dr. Watson, from A Scandal in Bohemia to The Copper Beeches. A complete LibriVox recording.',
    color: 'forest',
    sourceUrl: 'https://librivox.org/the-adventures-of-sherlock-holmes/',
    tracks: chapters(
      12,
      'holmes',
      (number) => archive('adventures_holmes', `adventureholmes_${two(number)}_doyle.mp3`),
      (number) => `${two(number)} · ${holmesTitles[number - 1]}`,
    ),
  },
  {
    id: 'pride-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    category: 'Classics',
    label: 'ROMANCE · CLASSIC',
    description:
      'Austen’s beloved story of wit, first impressions, and the Bennet sisters. Full-length public-domain audiobook; 61 individually playable chapters.',
    color: 'rose',
    sourceUrl: 'https://librivox.org/4023',
    tracks: chapters(
      61,
      'pride',
      (number) => archive('prideandprejudice_18_austen_64kb', `prideandprejudice_${two(number)}_austen_64kb.mp3`),
    ),
  },
  {
    id: 'persuasion',
    title: 'Persuasion',
    author: 'Jane Austen',
    category: 'Classics',
    label: 'LITERARY FICTION',
    description:
      'Anne Elliot is offered an unexpected second chance at love in Jane Austen’s final completed novel. A public-domain audiobook arranged by chapter.',
    color: 'ocean',
    sourceUrl: 'https://librivox.org/persuasion-by-jane-austen/',
    tracks: chapters(
      24,
      'persuasion',
      (number) => archive('persuasion_0905_librivox_64kb_mp3', `persuasion_${two(number)}_austen_64kb.mp3`),
    ),
  },
  // The original three URLs are preserved verbatim from the earlier ListenShelf prototype.
  // No automatic ingestion from the reference site is performed.
  {
    id: 'original-import',
    title: 'Original imported collection',
    author: 'William L. Pierce',
    category: 'Imported',
    label: 'PREVIOUSLY ADDED',
    description: 'The three-track collection from the original ListenShelf proof of concept. The source URLs have not been changed.',
    color: 'slate',
    tracks: [
      {
        id: 'recording-1',
        title: 'Pierce-Turner_Diaries-START-ch6',
        url: 'https://www.vanguardnewsnetwork.com/Massive/AudioBooks/Pierce-Turner_Diaries-START-ch6.mp3',
      },
      {
        id: 'recording-2',
        title: 'Pierce-Turner_Diaries-ch7-14',
        url: 'https://www.vanguardnewsnetwork.com/Massive/AudioBooks/Pierce-Turner_Diaries-ch7-14.mp3',
      },
      {
        id: 'recording-3',
        title: 'Pierce-Turner_Diaries-ch15-22',
        url: 'https://www.vanguardnewsnetwork.com/Massive/AudioBooks/Pierce-Turner_Diaries-ch15-22.mp3',
      },
    ],
  },
]

export const COLLECTION_COLORS = ['violet', 'forest', 'rose', 'ocean', 'amber', 'slate', 'coral'] as const

export function safeMediaUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export function validateCollection(raw: unknown): AudioCollection | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  if (
    typeof value.title !== 'string' ||
    typeof value.author !== 'string' ||
    !Array.isArray(value.tracks) ||
    value.tracks.length < 1 ||
    value.tracks.length > 500 ||
    value.title.trim().length < 1
  ) return null

  const tracks: AudioTrack[] = []
  for (const item of value.tracks) {
    if (!item || typeof item !== 'object') return null
    const track = item as Record<string, unknown>
    if (typeof track.title !== 'string' || typeof track.url !== 'string') return null
    const url = safeMediaUrl(track.url)
    if (!url || !track.title.trim()) return null
    tracks.push({ id: crypto.randomUUID(), title: track.title.trim().slice(0, 200), url })
  }

  return {
    id: crypto.randomUUID(),
    title: value.title.trim().slice(0, 150),
    author: value.author.trim().slice(0, 150) || 'Unknown author',
    category: typeof value.category === 'string' ? value.category.trim().slice(0, 40) || 'Other' : 'Other',
    description: typeof value.description === 'string' ? value.description.trim().slice(0, 600) : '',
    color: typeof value.color === 'string' && COLLECTION_COLORS.some((option) => option === value.color) ? value.color : 'violet',
    label: 'MY COLLECTION',
    artwork: typeof value.artwork === 'string' ? safeMediaUrl(value.artwork) ?? undefined : undefined,
    tracks,
    custom: true,
  }
}
