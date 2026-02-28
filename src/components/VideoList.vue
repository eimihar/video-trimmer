<script setup lang="ts">
import { ref } from 'vue'
import { useVideoStore, type SortField } from '../stores/videoStore'

const videoStore = useVideoStore()
const isDragOver = ref(false)

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatTrimDuration(video: { trimStart: number; trimEnd: number }): string {
  const duration = video.trimEnd - video.trimStart
  return formatDuration(duration)
}

async function openFileDialog() {
  const files = await window.electronAPI.openFileDialog()
  if (files && files.length > 0) {
    for (const filePath of files) {
      const name = filePath.split(/[/\\]/).pop() || 'Unknown'
      videoStore.addVideo(name, filePath, 0)
    }
  }
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as File & { path?: string }
      const validExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm']
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (validExtensions.includes(ext) && file.path) {
        videoStore.addVideo(file.name, file.path, 0)
      }
    }
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragLeave() {
  isDragOver.value = false
}

function handleContextMenu(event: MouseEvent, id: string) {
  event.preventDefault()
  videoStore.removeVideo(id)
}

function setSort(field: SortField) {
  videoStore.setSort(field)
}

function getSortIcon(field: SortField): string {
  if (videoStore.sortField !== field) return ''
  return videoStore.sortDirection === 'asc' ? ' ↑' : ' ↓'
}
</script>

<template>
  <div class="h-full flex flex-col">
    <button
      @click="openFileDialog"
      class="m-3 p-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors text-sm font-medium"
    >
      + Add Video
    </button>
    
    <div class="px-2 py-1 bg-gray-800 flex items-center justify-between">
      <div class="flex items-center gap-1">
        <span class="text-xs text-gray-400">Sort:</span>
        <button
          @click="setSort('name')"
          class="text-xs px-1 py-0.5 rounded transition-colors"
          :class="videoStore.sortField === 'name' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'"
        >
          Name{{ getSortIcon('name') }}
        </button>
        <button
          @click="setSort('duration')"
          class="text-xs px-1 py-0.5 rounded transition-colors"
          :class="videoStore.sortField === 'duration' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'"
        >
          Duration{{ getSortIcon('duration') }}
        </button>
        <button
          @click="setSort('date')"
          class="text-xs px-1 py-0.5 rounded transition-colors"
          :class="videoStore.sortField === 'date' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'"
        >
          Date{{ getSortIcon('date') }}
        </button>
      </div>
      <span class="text-xs text-gray-400">{{ videoStore.sortedPlaylist.length }} videos</span>
    </div>

    <div
      class="flex-1 overflow-y-auto"
      :class="{ 'bg-selected/20 border-2 border-dashed border-accent': isDragOver }"
      @drop.prevent="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <div
        v-if="videoStore.sortedPlaylist.length === 0"
        class="p-4 text-center text-gray-500 text-sm"
      >
        <div>Drop videos here</div>
        <div class="mt-2 text-xs text-gray-400">Videos added will automatically appear in playlist</div>
      </div>
      
      <div
        v-for="video in videoStore.sortedPlaylist"
        :key="video.id"
        @click="videoStore.selectVideo(video.id)"
        @contextmenu="handleContextMenu($event, video.id)"
        class="h-video-item px-3 flex items-center justify-between cursor-pointer border-b border-gray-800 transition-colors"
        :class="{
          'bg-selected': video.id === videoStore.selectedVideoId,
          'hover:bg-hover': video.id !== videoStore.selectedVideoId
        }"
      >
        <span class="truncate text-sm">{{ video.name }}</span>
        <span class="text-xs text-gray-400 ml-2 flex-shrink-0">
          {{ formatTrimDuration(video) }}
        </span>
      </div>
    </div>
    
    <div v-if="videoStore.playlist.length > 0" class="p-2 border-t border-gray-700">
      <button
        @click="videoStore.clearPlaylist()"
        class="w-full py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
      >
        Clear All
      </button>
    </div>
  </div>
</template>
