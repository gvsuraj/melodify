# Melodify - Music Streaming

A full-stack music streaming app with real-time synchronized listening rooms ("Vibe Together"). Built with React, TypeScript, Node.js, WebSocket, and Firebase.

## Features

- **Music Player** — Play, pause, skip, seek, shuffle, repeat with volume persistence
- **Search** — Real-time song search across title, artist, album, and genre
- **Liked Songs** — Save favorites to your personal library
- **Playlists** — Create, delete, and manage custom playlists
- **Vibe Together** — Create or join rooms for synchronized listening with up to 5 friends
  - Real-time playback sync via WebSocket with drift correction
  - Built-in chat
  - Host controls (play/pause, skip, queue management, host transfer)
- **Authentication** — Email/password and Google OAuth (Firebase Auth)
- **Dropbox Integration** — Music stored on Dropbox, streamed via shared links

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 6, Vite 8 |
| Backend | Node.js, Express |
| Database | Firebase Firestore (real-time) |
| Auth | Firebase Authentication |
| Real-time | WebSocket (`ws` library) |
| Storage | Dropbox API |
| Deployment | Render |

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project (with Auth and Firestore enabled)
- Dropbox account with music files

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

DROPBOX_ACCESS_TOKEN=your_dropbox_access_token
DROPBOX_FOLDER_PATH=/Music

FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json
# OR
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Installation

```bash
npm install
npm --prefix server install
```

## Project Structure

```text
Melodify/
├── .env.example              # Environment variable template
├── .gitignore                # Git ignore rules
├── index.html                # HTML entry point
├── package.json              # Root package (React + Vite)
├── tsconfig.json             # TypeScript config
├── vite.config.js            # Vite config (WS proxy)
│
├── public/
│   └── favicon.svg           # Site favicon
│
├── src/                      # React frontend
│   ├── main.tsx              # App entry point
│   ├── App.tsx               # Root router + layout
│   ├── App.css               # Layout styles
│   ├── index.css             # Global styles + variables
│   ├── types.ts              # Shared TypeScript interfaces
│   ├── vite-env.d.ts         # Vite type declarations
│   │
│   ├── components/           # UI components
│   │   ├── Auth/             # Login, Signup
│   │   ├── ConfirmDialog/    # Confirmation modal
│   │   ├── Home/             # Landing page
│   │   ├── Library/          # Liked songs
│   │   ├── Player/           # Bottom music player
│   │   ├── Playlist/         # Playlists CRUD + detail
│   │   ├── Search/           # Song search
│   │   ├── Settings/         # Profile & playback settings
│   │   ├── Sidebar/          # Navigation sidebar
│   │   ├── Toast/            # Toast notifications
│   │   └── Vibe/             # Vibe Together rooms
│   │
│   ├── contexts/             # React context providers
│   │   ├── AuthContext.tsx   # Firebase Auth state
│   │   ├── PlayerContext.tsx # Audio playback engine
│   │   ├── ToastContext.tsx  # Notification queue
│   │   └── VibeContext.tsx   # Room state + WebSocket
│   │
│   └── services/             # Service integrations
│       ├── firebase.ts       # Firebase client init
│       ├── songService.ts    # Songs (Firestore real-time)
│       ├── playlistService.ts# Playlists CRUD
│       ├── likeService.ts    # Like/unlike songs
│       ├── dropboxService.ts # Dropbox download links
│       ├── vibeService.ts    # Room Firestore operations
│       └── websocketService.ts # WebSocket client
│
├── server/                   # Node.js backend
│   ├── package.json          # Server dependencies
│   └── index.js              # Express + WebSocket server
│
└── scripts/                  # CLI utilities
    └── seedSongs.js          # Dropbox → Firestore seeder
```

### Development

```bash
npm run dev
```

Starts both the Vite dev server (port 5173) and the Express/WebSocket server (port 3001) concurrently with hot reload.

### Build & Run

```bash
npm run build
npm start
```

Serves the built frontend from `dist/` with the Express server.

### Seed Music Library

```bash
npm run seed
```

Scans your Dropbox folder and adds songs to Firestore.

## Deployment

Deploy to [Render](https://render.com) as a Web Service:

- **Build Command:** `npm install --include=dev && npm run build`
- **Start Command:** `npm start`
- Add all environment variables (including `NODE_ENV=production`)
- Add your Render domain to Firebase Authentication authorized domains for Google OAuth
