# Shelf

Turn any EPUB into a searchable, offline-first web library — deployed free on GitHub Pages.

Shelf is a personal search engine for books and essays. Drop in an EPUB, and the CLI extracts chapters, generates semantic tags with a local LLM, and builds a static site you can search from anywhere — even without an internet connection.

---

## How it works

```
EPUB → Markdown → Semantic chunks → AI tags → Static JSON → Client-side search
```

1. **Import** — `process_book.py` extracts clean markdown from EPUB, detects chapters (5 heading patterns), and splits content into semantic chunks via LlamaIndex.
2. **Tag** — Each chunk gets 3–5 single-word semantic tags from a local Ollama model (`qwen2.5:7b`). No API costs, no data leaves your machine.
3. **Build** — `sync/build.py` compiles all chunks into a single `metadata.json` with full content, plus a `tags.json` index.
4. **Search** — Fuse.js powers weighted keyword/fuzzy search in the browser. Tag filtering uses exact AND logic. Results paginate at 25 per page.
5. **Deploy** — Push to GitHub and Actions deploys to Pages. A service worker pre-caches everything for offline use.

## Quick start

### Prerequisites

- Python 3.10+
- Node.js 20+
- [Ollama](https://ollama.com) with `qwen2.5:7b` (`ollama pull qwen2.5:7b`)

### Setup

```bash
git clone https://github.com/<you>/shelf.git && cd shelf
./setup.sh      # Creates venv, installs Python deps
npm install     # Installs Node deps
```

### Add a book

```bash
ollama serve                # Start the local LLM (if not running)
./lib book.epub             # Process and add a book
./lib --sync                # Build the search index
npm run dev                 # Preview at localhost:5173
```

### Manage your library

```bash
./lib --list                # List all books
./lib --delete "Title"      # Remove a book
./lib --sync                # Rebuild after changes
```

### Deploy

Push to GitHub with Pages enabled. The included workflow builds and deploys automatically.

> **Note:** Update `base` in `vite.config.js` to `/<your-repo-name>/`. All runtime paths derive from this single setting automatically.

## Architecture

```
shelf/
├── lib                      # CLI entry point (bash)
├── process_book.py          # EPUB → chunks → tags pipeline
├── setup.sh                 # One-command environment setup
├── sync/
│   └── build.py             # Generates metadata.json + tags.json
├── src/
│   ├── search.js            # Fuse.js search engine (weighted fields)
│   ├── main.js              # UI logic, pagination, autocomplete
│   ├── service-worker.js    # Cache-first offline support
│   └── styles.css           # Minimal, mobile-first CSS
├── public/data/             # Generated search index (committed)
│   ├── metadata.json
│   └── tags.json
├── index.html               # Search interface
└── chunk.html               # Dynamic chunk viewer (renders markdown)
```

### Design decisions

**Client-side search, no backend.** All book data ships as static JSON. Fuse.js (9KB) handles fuzzy matching with field weights tuned for book content — title matches rank highest, raw content lowest. This eliminates hosting costs and keeps the app fast on repeat visits.

**Local AI for tagging.** Ollama runs on your machine. Tags like `"jealousy, rivalry, comparison"` make 1–2 word searches useful in a way that full-text search alone can't. No API key, no usage limits, no data uploaded anywhere.

**Offline-first.** A service worker pre-caches the app shell and all search data on first load. After that, the entire library works without a connection. Cache versioning ensures updates propagate cleanly.

**Single-page chunk viewer.** One `chunk.html` renders any chunk dynamically from `metadata.json` using `marked.js`. No static HTML generation, no build step per book.

## Search weights

| Field | Weight | Rationale |
|-------|--------|-----------|
| Book title | 0.4 | Highest — narrows to a specific work |
| Chapter title | 0.3 | Structural navigation |
| Tags | 0.2 | Semantic discovery |
| Content | 0.1 | Lowest — avoids noise from long text |

## Tech stack

| Layer | Tools |
|-------|-------|
| Processing | Python, ebooklib, BeautifulSoup, LlamaIndex |
| Tagging | Ollama, qwen2.5:7b |
| Search | Fuse.js (client-side) |
| Frontend | Vanilla JS, Vite, marked.js |
| Offline | Service Worker (cache-first) |
| Deploy | GitHub Actions → GitHub Pages |

## Fork and customize

1. Fork this repo
2. Delete `public/data/` contents (example data ships with the repo)
3. Update `base` in `vite.config.js` to `/<your-repo-name>/` — all paths derive from this automatically
4. Run `./setup.sh && npm install`
5. Add your own EPUBs with `./lib <book.epub>`
6. Enable GitHub Pages (Actions source) in repo settings

## License

MIT
