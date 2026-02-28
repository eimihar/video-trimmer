<script setup lang="ts">
import { ref, watch } from 'vue'
import { useVideoStore } from '../stores/videoStore'

const videoStore = useVideoStore()
const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function togglePlay() {
  if (!videoRef.value) return
  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

function stop() {
  if (!videoRef.value) return
  videoRef.value.pause()
  videoRef.value.currentTime = videoStore.trimStart
  isPlaying.value = false
}

function handleTimeUpdate() {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
  
  if (videoRef.value.currentTime >= videoStore.trimEnd) {
    videoRef.value.currentTime = videoStore.trimStart
    if (!isPlaying.value) {
      videoRef.value.play()
    }
  }
}

function handleLoadedMetadata() {
  if (!videoRef.value || !videoStore.selectedVideo) return
  duration.value = videoRef.value.duration
  videoStore.updateVideoDuration(videoStore.selectedVideo.id, videoRef.value.duration)
  videoStore.trimEnd = videoRef.value.duration
}

function handleSeek(event: MouseEvent) {
  if (!videoRef.value) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const time = percent * duration.value
  videoRef.value.currentTime = time
  currentTime.value = time
}

watch(() => videoStore.selectedVideo?.path, () => {
  if (videoRef.value) {
    videoRef.value.load()
    isPlaying.value = false
    currentTime.value = 0
  }
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div 
      v-if="!videoStore.selectedVideo"
      class="flex-1 flex items-center justify-center bg-black/50 rounded"
    >
      <span class="text-gray-500">Select a video to preview</span>
    </div>
    
    <div v-else class="flex flex-col h-full">
      <div class="flex-1 bg-black rounded overflow-hidden flex items-center justify-center">
        <video
          ref="videoRef"
          :src="'file://' + videoStore.selectedVideo.path"
          class="max-w-full max-h-full"
          @timeupdate="handleTimeUpdate"
          @loadedmetadata="handleLoadedMetadata"
          @ended="isPlaying = false"
        ></video>
      </div>
      
      <div class="mt-4">
        <div 
          class="h-2 bg-gray-700 rounded cursor-pointer relative"
          @click="handleSeek"
        >
          <div 
            class="absolute h-full bg-accent"
            :style="{ width: `${(currentTime / duration) * 100}%` }"
          ></div>
        </div>
        
        <div class="flex items-center justify-between mt-2 text-sm">
          <span>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
          
          <div class="flex gap-2">
            <button
              @click="togglePlay"
              class="px-4 py-1 bg-accent text-white rounded hover:bg-accent-hover transition-colors"
            >
              {{ isPlaying ? '⏸ Pause' : '▶ Play' }}
            </button>
            <button
              @click="stop"
              class="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            >
              ⏹ Stop
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>