# pady

A collaborative document editing platform. Create, edit, and share documents with real-time collaboration support.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 3 |
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
│   │   └── models/Models.ts    # TypeScript interfaces (User, Document, Collaborator)
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
   git clone https://github.com/arit-pal/pady.git && cd pady
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
# Reads ../.env for DB config, connects to postgres, runs migrations automatically
```

**Frontend only** (requires a running backend):

```bash
cd frontend
npm install
npm run dev
# Reads .env from parent directory (repo root)
```

## Features

### Document Management

- Create, rename, and delete documents
- Star/unstar documents for quick access
- Toggle document visibility (private/public)
- Share documents with collaborators (owner/editor/viewer roles)
- Search users by email when sharing

### Editor

- Plain text editing with auto-save (1-second debounce)
- Save status indicator (saving/saved/error)
- Unsaved changes warning on navigation
- Viewer mode for read-only access

### Authentication

- JWT-based authentication
- Login and signup pages
- Protected routes redirect to login when unauthenticated
- Auto-logout on token expiry (401 response)

## License

See [LICENSE](LICENSE) for details.
