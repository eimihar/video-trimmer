# Video Trimmer Desktop App - Requirements & Steps

---

## 1. Project Overview

**Project Name:** VideoTrimmer

**Core Feature Summary:** A desktop application that allows users to drag videos into a list, preview them, set trim points (start/end), and apply the trim to create a new video file.

**Target Users:** Casual users who need quick, simple video trimming without complex editing software.

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Desktop Framework | Electron |
| Frontend Framework | Vue 2 (Options API) |
| State Management | Pinia |
| Video Processing | FFmpeg (via fluent-ffmpeg) |
| Build Tool | Vite + electron-builder |

---

## 3. UI/UX Requirements

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Window Title Bar (native)                                  │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│   Left Nav    │              Right Panel                    │
│   (250px)     │                                             │
│               │  ┌─────────────────────────────────────┐   │
│  + Add Video  │  │                                     │   │
│               │  │         Video Preview               │   │
│  ───────────  │  │           (HTML5 Video)             │   │
│               │  │                                     │   │
│  Video List   │  └─────────────────────────────────────┘   │
│  - video1.mp4 │                                             │
│  - video2.mp4 │  Timeline / Trim Controls                   │
│  - video3.mp4 │  [====|████████|====]                      │
│               │  Start: 00:00:10  End: 00:00:50            │
│               │                                             │
│               │  [▶ Play] [⏹ Stop]                          │
│               │                                             │
│               │  [ TRIM VIDEO ]                             │
│               │                                             │
├───────────────┴─────────────────────────────────────────────┤
│  Status Bar: Ready / Processing... / Done                   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Visual Specifications

| Element | Specification |
|---------|---------------|
| Left Panel Width | 250px fixed |
| Background Color | #1e1e1e (dark) |
| Left Panel Background | #252526 |
| Accent Color | #007acc (blue) |
| Text Color | #cccccc |
| Video Item Height | 48px |
| Selected Item | #094771 background |
| Button Primary | #007acc background, white text |
| Button Hover | #1f8ad2 |
| Trim Slider | Custom styled range input |

### 3.3 Component States

| Component | States |
|-----------|--------|
| Video List Item | Default, Hover (#2a2d2e), Selected (#094771), Playing indicator |
| Trim Button | Default, Hover, Disabled (during processing), Loading |
| Video Player | Empty, Loaded, Playing, Paused |
| Add Button | Default, Hover, Drag-over highlight |

---

## 4. Functional Requirements

### 4.1 Core Features

#### F1: Video Import (Drag & Drop)
- User can drag video files from system file explorer into the left panel
- User can click "Add Video" button to open file dialog
- Supported formats: MP4, AVI, MOV, MKV, WebM
- Maximum file size: 2GB (display warning for larger files)

#### F2: Video List Management
- Display list of added videos with filename
- Show video duration next to filename
- Allow selection by clicking on list item
- Allow removal of videos (right-click context menu or delete button)
- Persist list during session (not across app restarts)

#### F3: Video Preview
- Display selected video in right panel using HTML5 video player
- Show video thumbnail or first frame when no video selected
- Play/Pause functionality
- Display current playback time
- Seek to any position by clicking on video timeline

#### F4: Trim Selection
- Two slider controls: Start Time and End Time
- Visual representation of selected trim region
- Time format: HH:MM:SS or MM:SS
- Validation: End time must be > Start time
- Minimum trim duration: 1 second
- Real-time preview of trim start/end frames

#### F5: Apply Trim
- "Trim Video" button triggers processing
- Show progress indicator during processing
- Output file saved to same directory as original with suffix `_trimmed`
- Output format: Same as input format
- Show success/error notification when complete

### 4.2 User Interactions Flow

```
1. Launch App
       ↓
2. Drag video file(s) into left panel OR click "Add Video"
       ↓
3. Video appears in list → Click to select
       ↓
4. Video loads in preview player
       ↓
5. Adjust trim sliders to set start/end points
       ↓
6. Click "Trim Video" button
       ↓
7. Processing... (show progress)
       ↓
8. Success message → File saved
```

### 4.3 Data Flow & Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ELECTRON MAIN PROCESS                    │
│  - Window management                                         │
│  - File dialogs                                              │
│  - FFmpeg command execution                                  │
│  - IPC handlers                                              │
└─────────────────────────────────────────────────────────────┘
                              ↑↓ IPC
┌─────────────────────────────────────────────────────────────┐
│                     RENDERER PROCESS (Vue)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Components │  │   Pinia     │  │    Composables      │ │
│  │  - NavBar   │←→│   Store     │←→│  - useVideoPlayer   │ │
│  │  - VideoList│  │  - videos[] │  │  - useTrimmer       │ │
│  │  - Preview  │  │  - selected │  │                     │ │
│  │  - Trimmer  │  │  - trimRange│  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Key Modules Design

| Module | Responsibility | Public API |
|--------|---------------|------------|
| `videoStore` (Pinia) | Manage video list state | `addVideo()`, `removeVideo()`, `selectVideo()`, `setTrimRange()` |
| `VideoList.vue` | Display and interact with video list | Props: `videos`, Events: `select`, `remove` |
| `VideoPreview.vue` | HTML5 video player wrapper | Props: `src`, Events: `timeupdate`, `loadedmetadata` |
| `TrimControls.vue` | Trim sliders and time inputs | Props: `duration`, `start`, `end`, Events: `update:start`, `update:end` |
| `ffmpegService.js` (main process) | Execute FFmpeg commands | `trimVideo(inputPath, outputPath, startTime, endTime)` |

### 4.5 Edge Cases

| Scenario | Handling |
|----------|----------|
| Invalid video file dropped | Show error toast "Invalid video file" |
| Video file too large (>2GB) | Show warning, allow user to proceed |
| Trim start >= end time | Disable trim button, show validation error |
| FFmpeg not installed | Show error on startup, provide install instructions |
| Processing interrupted | Clean up temp files, show error message |
| No videos in list | Show placeholder "Drop videos here" |
| Video codec unsupported | Show error "Codec not supported, please use different format" |

---

## 5. Technical Requirements

### 5.1 Dependencies

```json
{
  "electron": "^28.0.0",
  "vue": "^2.7.0",
  "pinia": "^2.1.0",
  "fluent-ffmpeg": "^2.1.0",
  "@ffmpeg-installer/ffmpeg": "^1.1.0",
  "electron-builder": "^24.9.0",
  "vite": "^5.0.0",
  "@vitejs/plugin-vue2": "^2.3.0"
}
```

### 5.2 Project Structure

```
videotrimmer/
├── electron/
│   ├── main.js           # Main process entry
│   ├── preload.js        # Preload script for IPC
│   └── ffmpegService.js  # FFmpeg wrapper
├── src/
│   ├── main.js           # Vue app entry
│   ├── App.vue           # Root component
│   ├── components/
│   │   ├── VideoList.vue
│   │   ├── VideoPreview.vue
│   │   ├── TrimControls.vue
│   │   └── StatusBar.vue
│   ├── stores/
│   │   └── videoStore.js # Pinia store
│   └── assets/
│       └── styles.css
├── index.html
├── vite.config.js
├── electron-builder.json
└── package.json
```

---

## 6. Steps to Reproduce

### Step 1: Initialize Project

```bash
# Create project directory
mkdir videotrimmer && cd videotrimmer

# Initialize npm project
npm init -y

# Install Vue 2 and build tools
npm install vue@2.7 pinia@2.1
npm install -D vite@5 @vitejs/plugin-vue2 electron@28 electron-builder@24

# Install FFmpeg wrapper
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
```

### Step 2: Configure Vite for Vue 2

Create `vite.config.js`:

- Set up Vue 2 plugin
- Configure base path for Electron
- Set up dev server on port 5173

### Step 3: Set Up Electron Main Process

Create `electron/main.js`:

- Initialize BrowserWindow
- Load Vue app from dev server URL (dev) or build output (prod)
- Set up IPC handlers for:
  - `dialog:openFile` - open file picker
  - `video:trim` - execute FFmpeg trim
  - `app:getPath` - get user directories

Create `electron/preload.js`:

- Expose safe IPC methods to renderer via contextBridge

### Step 4: Create Vue Application

Create `index.html`:

- Root div with id="app"
- Import Vue app entry point

Create `src/main.js`:

- Initialize Vue with Options API
- Install Pinia
- Mount to #app

### Step 5: Build Pinia Store

Create `src/stores/videoStore.js`:

- State: `videos` array, `selectedVideoId`, `trimStart`, `trimEnd`, `isProcessing`
- Actions: `addVideo()`, `removeVideo()`, `selectVideo()`, `setTrimRange()`, `trimVideo()`

### Step 6: Create Components

Create `src/components/VideoList.vue`:

- Left panel with drag-drop zone
- List of video items
- Click to select, right-click to remove
- Emit events for select/remove/add

Create `src/components/VideoPreview.vue`:

- HTML5 video element
- Play/pause controls
- Display current time / duration

Create `src/components/TrimControls.vue`:

- Two range sliders for start/end
- Time input fields
- Visual timeline indicator
- Sync with video preview

Create `src/components/StatusBar.vue`:

- Display current status
- Processing progress

### Step 7: Implement FFmpeg Service

Create `electron/ffmpegService.js`:

- Use fluent-ffmpeg with @ffmpeg-installer/ffmpeg
- Implement trim function with progress callback
- Handle codec copying for speed

### Step 8: Wire Up IPC Communication

In renderer:

- Use `window.electronAPI` (from preload) to call main process
- Handle file dialog results
- Call trim function and handle response

### Step 9: Style Application

Create `src/assets/styles.css`:

- Dark theme matching specifications
- Flexbox layout for panels
- Custom scrollbars
- Button styles

### Step 10: Configure Electron Builder

Create `electron-builder.json`:

- Set app name, product name
- Configure win/mac/linux targets
- Include FFmpeg binary
- Set up file associations

### Step 11: Test in Development Mode

```bash
npm run dev
```

- Verify drag-drop works
- Verify video playback
- Verify trim controls
- Test actual video trimming

### Step 12: Build Production App

```bash
npm run build
npm run electron:build
```

- Generate executable for Windows/Mac/Linux

---

## 7. Acceptance Criteria

| # | Criteria | Verification Method |
|---|----------|---------------------|
| AC1 | App launches without errors | Run .exe, observe window appears |
| AC2 | Can drag video files into left panel | Drag MP4 file, observe appears in list |
| AC3 | Can click "Add Video" to open file dialog | Click button, file picker opens |
| AC4 | Selected video plays in preview | Select video, click play |
| AC5 | Trim sliders adjust start/end time | Move sliders, time updates |
| AC6 | Trim button triggers processing | Click trim, observe progress |
| AC7 | Trimmed video file is created | Check output directory for `_trimmed` file |
| AC8 | App builds to executable | Run build, .exe file exists |

---

## 8. Known Limitations (Out of Scope)

- Video codec conversion (only trim, no re-encode)
- Audio-only files
- Batch processing multiple videos
- Video merging
- Adding transitions/effects
- Export to different formats
- Cloud integration
- Undo/Redo functionality

---

This completes the requirements document and implementation steps for your VideoTrimmer Electron app using Vue Options API and Pinia.