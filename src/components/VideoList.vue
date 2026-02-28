<script setup lang="ts">
import { ref } from 'vue'
import { useVideoStore } from '../stores/videoStore'

const videoStore = useVideoStore()
const isDragOver = ref(false)

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
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
</script>

<template>
  <div class="h-full flex flex-col">
    <button
      @click="openFileDialog"
      class="m-3 p-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors text-sm font-medium"
    >
      + Add Video
    </button>
    
    <div
      class="flex-1 overflow-y-auto"
      :class="{ 'bg-selected/20 border-2 border-dashed border-accent': isDragOver }"
      @drop.prevent="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <div
        v-if="videoStore.videos.length === 0"
        class="p-4 text-center text-gray-500 text-sm"
      >
        Drop videos here
      </div>
      
      <div
        v-for="video in videoStore.videos"
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
        <span class="text-xs text-gray-500 ml-2 flex-shrink-0">
          {{ formatDuration(video.duration) }}
        </span>
      </div>
    </div>
  </div>
</template>