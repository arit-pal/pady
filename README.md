# pady

A real-time collaboration tool for web documents. Create, edit, and share rich text documents with a Google Docs-like editing experience.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 3, TipTap (ProseMirror) |
| Backend | Go 1.25, pgx/v5, golang-migrate, JWT auth |
| Database | PostgreSQL 17 (Alpine) |
| Infrastructure | Docker Compose, Nginx |

## Project Structure

```
pady/
├── backend/
│   ├── main.go                 # Entry point, calls app.Start()
│   ├── app/app.go              # Wires DB, migrations, router, HTTP server
│   ├── api/routes.go           # Router definition
│   ├── handlers/               # HTTP handlers (user, document)
│   ├── service/                # Business logic
│   ├── domain/                 # Domain types
│   ├── dto/                    # Request/response DTOs
│   ├── mapper/                 # DTO ↔ domain mapping
│   ├── db/
│   │   ├── db.go               # pgx pool, .env loading
│   │   ├── migrate.go          # golang-migrate up/rollback
│   │   └── migrations/         # Numbered SQL migration files
│   └── config/jwt.go           # JWT secret initialization
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Route definitions
│   │   ├── pages/              # Page components (Login, SignUp, Dashboard, Editor, Privacy, Terms)
│   │   ├── context/            # Auth context (AuthProvider, useAuth)
│   │   ├── api/Api.ts          # Axios client with JWT interceptors
│   │   ├── models/Models.ts    # TypeScript interfaces (User, Document, Collaborator)
│   │   └── editor/             # Rich text editor module
│   │       ├── EditorContent.tsx    # TipTap editor wrapper
│   │       ├── Toolbar.tsx          # Formatting toolbar
│   │       ├── Statusbar.tsx        # Word count + save status
│   │       ├── MenuButton.tsx       # Reusable toolbar button
│   │       ├── ShortcutsHelp.tsx    # Keyboard shortcuts modal
│   │       ├── serializer.ts        # Legacy plain text → TipTap doc converter
│   │       └── extensions/          # TipTap extension config
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── eslint.config.js
├── docker-compose.yml
├── docker-compose.override.yml  # Exposes Postgres on host port 5432 (gitignored)
└── .env.example
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- An `.env` file at the project root

### Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url> && cd pady
   ```

2. **Create your environment file**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in real values:

   ```env
   POSTGRES_USER=your_db_user
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_HOST=postgres
   POSTGRES_PORT=5432
   POSTGRES_DB=your_db_name
   SERVER_PORT=8000
   JWT_SECRET=your_super_secret_jwt_key
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

3. **Start the application**

   ```bash
   docker compose up --build
   ```

   | Service | URL |
   |---------|-----|
   | Frontend | http://localhost:5173 |
   | Backend API | http://localhost:8000 |
   | Postgres | localhost:5432 |

> **Note:** Always use `--build` after code changes. Without it, Docker uses cached images and changes won't be reflected.

### Running Without Docker

**Backend only** (requires a running Postgres instance):

```bash
cd backend
go run main.go
# Reads ../.env for DB config, runs migrations automatically
```

**Frontend only** (requires a running backend):

```bash
cd frontend
npm install
npm run dev
# Reads .env from parent directory (repo root)
```

## Features

### Rich Text Editor

- **Formatting**: Bold, italic, underline, strikethrough, inline code
- **Headings**: H1, H2, H3
- **Lists**: Bullet lists, ordered lists, task lists (checkboxes)
- **Blocks**: Blockquotes, code blocks with syntax styling, horizontal rules
- **Undo/Redo**: Full history with keyboard shortcuts

### Markdown Shortcuts

Type markdown syntax inline and it auto-converts on space:

| Input | Result |
|-------|--------|
| `# ` | Heading 1 |
| `## ` | Heading 2 |
| `### ` | Heading 3 |
| `**text**` | **Bold** |
| `*text*` | *Italic* |
| `~~text~~` | ~~Strikethrough~~ |
| `` `code` `` | `Inline code` |
| ```` ``` ```` | Code block |
| `- ` or `* ` | Bullet list |
| `1. ` | Ordered list |
| `> ` | Blockquote |
| `---` | Horizontal rule |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+Shift+X | Strikethrough |
| Ctrl+Shift+C | Inline code |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |

Press the keyboard icon in the toolbar to view all shortcuts.

### Document Management

- Create, rename, and delete documents
- Star/unstar documents for quick access
- Toggle document visibility (private/public)
- Share documents with collaborators (owner/editor/viewer roles)
- Search users by email when sharing

### Editor UX

- **Auto-save**: Content saves automatically with a 1-second debounce
- **Save status indicator**: Shows saving/saved/error state in the toolbar and status bar
- **Word and character count**: Live count in the status bar
- **Unsaved changes protection**: Warns before leaving with unsaved edits (tab close, navigation)
- **Legacy content migration**: Existing plain-text documents auto-convert to rich text on open
- **Responsive design**: Toolbar adapts to screen size, touch-friendly on mobile
- **Viewer mode**: Read-only editor with dimmed toolbar for shared view-only access

### Authentication

- JWT-based authentication
- Login and signup pages
- Protected routes redirect to login when unauthenticated
- Auto-logout on token expiry (401 response)

## License

See [LICENSE](LICENSE) for details.
