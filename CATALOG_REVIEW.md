# ListenShelf — catalog review and deferred-book list

**Last reviewed:** 2026-10-19

This file is a shared reference for books and source websites that have been considered for ListenShelf but **not added to the permanent catalog**. It prevents repeatedly suggesting the same unavailable recordings. It also keeps useful links for later, when rights or technical access are clearer.

The permanent catalog lives in [`src/library.ts`](src/library.ts). This file is **not** a playlist and does not load content into the app.

## How to use this list

- **Rights not cleared:** We found an audiobook or book listing, but haven't established permission to stream its recordings directly inside ListenShelf. A bookstore or library listing **is not** a licensed MP3 link.
- **Source not compatible:** The listing is a webpage or account-restricted player rather than a direct HTTPS audio stream accessible to ListenShelf.
- **Content review:** We will not automatically bulk-import collections that promote violent extremism or white-supremacist propaganda. Bibliographic/reference links can still be recorded for research.
- **Can revisit:** An entry is not a permanent prohibition. If a clearly permitted, compatible audio edition is found later, review the new source and update this list.
- **Copyright applies separately to the text, recording, translation, performance, and cover image.** Don't assume free listening means permission to republish or embed.
- When a book is successfully added, mark its status **Added** and link to the `src/library.ts` entry. Preserve existing book and audio URLs when editing.

## Deferred audiobook leads

| Work | Author | Source listing (NOT a direct MP3) | Status and reason |
|---|---|---|---|
| **Nineteen Eighty-Four (1984)** | George Orwell | [OverDrive audiobook, Blackstone Publishing (2024)](https://www.overdrive.com/media/10749714/1984) · [Audible collection](https://www.audible.com/pd/The-George-Orwell-Complete-Collection-Audiobook/B09NQFKHNV) | **Rights not cleared / restricted player.** The book is still under copyright in the U.S. (generally expected to enter the U.S. public domain in 2045). The commercial recordings also have their own rights. No licensed direct streaming file obtained. |
| **Animal Farm** | George Orwell | [Audible Orwell collection](https://www.audible.com/pd/The-George-Orwell-Complete-Collection-Audiobook/B09NQFKHNV) | **Rights not cleared / restricted player.** Still under copyright in the U.S. (generally expected public-domain entry in 2041). No licensed direct audio file obtained. |
| **Down and Out in Paris and London** | George Orwell | [Audible Orwell collection](https://www.audible.com/pd/The-George-Orwell-Complete-Collection-Audiobook/B09NQFKHNV) | **Rights/source review needed.** A commercial audiobook listing does not grant permission for streaming through ListenShelf. |
| **The Road to Wigan Pier** | George Orwell | [Audible Orwell collection](https://www.audible.com/pd/The-George-Orwell-Complete-Collection-Audiobook/B09NQFKHNV) | **Rights/source review needed.** No reuse permission or direct audio source verified. |
| **Homage to Catalonia** | George Orwell | [Audible Orwell collection](https://www.audible.com/pd/The-George-Orwell-Complete-Collection-Audiobook/B09NQFKHNV) | **Rights/source review needed.** No reuse permission or direct audio source verified. |
| **Burmese Days** | George Orwell | [Audible Orwell collection](https://www.audible.com/pd/The-George-Orwell-Complete-Collection-Audiobook/B09NQFKHNV) | **Rights/source review needed.** No reuse permission or direct audio source verified. |
| **Coming Up for Air** | George Orwell | [Audible Orwell collection](https://www.audible.com/pd/The-George-Orwell-Complete-Collection-Audiobook/B09NQFKHNV) | **Rights/source review needed.** No reuse permission or direct audio source verified. |
| **Keep the Aspidistra Flying** | George Orwell | [Audible Orwell collection](https://www.audible.com/pd/The-George-Orwell-Complete-Collection-Audiobook/B09NQFKHNV) | **Rights/source review needed.** No reuse permission or direct audio source verified. |
| **A Clergyman's Daughter** | George Orwell | [Audible Orwell collection](https://www.audible.com/pd/The-George-Orwell-Complete-Collection-Audiobook/B09NQFKHNV) | **Rights/source review needed.** No reuse permission or direct audio source verified. |
| **Brave New World** | Aldous Huxley | [OverDrive audiobook narrated by Michael York](https://www.overdrive.com/media/149851/brave-new-world) | **Rights not cleared / restricted player.** A thematically related book for later consideration, but this publisher recording cannot be freely embedded. |
| **Fahrenheit 451** | Ray Bradbury | [OverDrive audiobook narrated by Ray Bradbury](https://www.overdrive.com/media/76271/fahrenheit-451) | **Rights not cleared / restricted player.** A thematically related book for later consideration, but this publisher recording cannot be freely embedded. |

### Source-level review note

| Website / collection | Source URL | Reason to review before importing |
|---|---|---|
| Additional recordings from Alex Linder's audio archive | https://www.alexlinder.com/audio.html | Some material is white-supremacist or extremist propaganda. Do not automatically bulk-import it. The three original URLs already in ListenShelf's `src/library.ts` have not been modified. Any other title would need individual content and rights review. |

## What **can** be added

Prefer complete, accessible recordings with clear reuse/streaming permission, such as suitably licensed public-domain audiobooks or freely distributed original recordings from their rights holders. Check that the audio URL is a reachable HTTPS stream, verify whether the recording and any cover art may be used, then add the collection to `src/library.ts`. Content being *public domain in one country* does not automatically make it public domain in the United States.

## References for rights checks

- [Cornell University — U.S. copyright and public-domain chart (updated 2026)](https://guides.library.cornell.edu/copyright/publicdomain)
- [U.S. Copyright Office — How long does copyright last?](https://copyright.gov/help/faq/faq-duration.html)
- [OverDrive/Libby](https://www.overdrive.com/): useful for finding a title and borrowing access, **not** by itself a license to stream in ListenShelf.
- [LibriVox](https://librivox.org/): volunteer recordings of public-domain texts; check each recording's source and applicable territory.

## Future entries (template)

| Work | Author | Source URL | Status and reason |
|---|---|---|---|
| _Title_ | _Name_ | _Link_ | _Rights not cleared / incompatible player / content review; date checked_ |
