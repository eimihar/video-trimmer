# VideoTrimmer

A desktop application for trimming videos with a simple interface. Built with Electron, Vue 3, TypeScript, and Tailwind CSS.

## Features

- Drag & drop or click to add video files
- Preview videos with play/pause controls
- Set trim start and end points using sliders or the video timeline
- Visual trim region on the timeline
- Trim videos using FFmpeg
- Dark theme UI

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

```bash
npm install
```

## Development

### Run Vite dev server only (frontend)

```bash
npm run dev
```

### Run full Electron app in development mode

```bash
npm run electron:dev
```

This will:
1. Start the Vite dev server on http://localhost:5173
2. Start Electron with the app

## Build

### Build frontend only

```bash
npm run build
```

This runs TypeScript type check and builds the Vue app to `dist/`.

### Build Electron app (unpacked)

```bash
npm run electron:build
```

This builds the frontend and packages the Electron app to `release/win-unpacked/`.

The executable will be at: `release/win-unpacked/VideoTrimmer.exe`

### Build portable exe

```bash
npm run electron:build:portable
```

This creates a portable .exe file in `release/`.

## Project Structure

```
videotrimmer/
├── electron/           # Electron main process
│   ├── main.ts         # Main process entry
│   ├── preload.ts      # Preload script
│   └── ffmpegService.ts # FFmpeg wrapper
├── src/                # Vue frontend
│   ├── components/     # Vue components
│   ├── stores/         # Pinia stores
│   ├── App.vue         # Root component
│   └── main.ts         # Vue entry
├── dist/               # Built frontend
├── dist-electron/      # Compiled Electron files
├── release/            # Built Electron app
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Tech Stack

- **Frontend**: Vue 3, TypeScript, Tailwind CSS 3, Pinia
- **Desktop**: Electron 28
- **Video Processing**: FFmpeg (via fluent-ffmpeg)
- **Build**: Vite, electron-builder

## Supported Video Formats

MP4, AVI, MOV, MKV, WebM