<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useVideoStore } from '../stores/videoStore'

const videoStore = useVideoStore()
const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const sliderRef = ref<HTMLElement | null>(null)
const dragging = ref<'start' | 'end' | null>(null)

const trimStartPercent = computed(() => (videoStore.trimStart / duration.value) * 100)
const trimEndPercent = computed(() => (videoStore.trimEnd / duration.value) * 100)
const currentTimePercent = computed(() => (currentTime.value / duration.value) * 100)

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
    if (videoRef.value.currentTime < videoStore.trimStart || videoRef.value.currentTime >= videoStore.trimEnd) {
      videoRef.value.currentTime = videoStore.trimStart
    }
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
    if (videoStore.isPlaylistPlaying) {
      videoStore.playNextInPlaylist()
      if (videoStore.selectedVideo) {
        videoRef.value.load()
        videoRef.value.play()
      }
    } else {
      videoRef.value.currentTime = videoStore.trimStart
      if (!isPlaying.value) {
        videoRef.value.play()
      }
    }
  }
}

function handleLoadedMetadata() {
  if (!videoRef.value || !videoStore.selectedVideo) return
  duration.value = videoRef.value.duration
  videoStore.updateVideoDuration(videoStore.selectedVideo.id, videoRef.value.duration)
  if (videoStore.trimEnd === 0) {
    videoStore.trimEnd = videoRef.value.duration
  }
}

function handleSeek(event: MouseEvent) {
  if (!videoRef.value || !sliderRef.value) return
  const rect = sliderRef.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  const time = percent * duration.value
  
  if (time >= videoStore.trimStart && time <= videoStore.trimEnd) {
    videoRef.value.currentTime = time
    currentTime.value = time
  } else if (time < videoStore.trimStart) {
    videoRef.value.currentTime = videoStore.trimStart
    currentTime.value = videoStore.trimStart
  } else {
    videoRef.value.currentTime = videoStore.trimEnd
    currentTime.value = videoStore.trimEnd
  }
}

function startDrag(event: MouseEvent, thumb: 'start' | 'end') {
  event.preventDefault()
  dragging.value = thumb
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
}

function handleDrag(event: MouseEvent) {
  if (!dragging.value || !sliderRef.value) return
  const rect = sliderRef.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  const time = percent * duration.value
  
  if (dragging.value === 'start') {
    const newStart = Math.min(time, videoStore.trimEnd - 1)
    videoStore.setTrimRange(Math.max(0, newStart), videoStore.trimEnd)
  } else {
    const newEnd = Math.max(time, videoStore.trimStart + 1)
    videoStore.setTrimRange(videoStore.trimStart, Math.min(duration.value, newEnd))
  }
}

function stopDrag() {
  dragging.value = null
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

watch(() => videoStore.selectedVideo?.path, () => {
  if (videoRef.value) {
    videoRef.value.load()
    isPlaying.value = false
    currentTime.value = videoStore.trimStart
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
          ref="sliderRef"
          class="h-3 bg-gray-700 rounded cursor-pointer relative select-none"
          @click="handleSeek"
        >
          <div 
            class="absolute h-full bg-gray-600"
            :style="{ left: '0%', width: '100%' }"
          ></div>
          
          <div 
            class="absolute h-full bg-accent/30"
            :style="{ left: `${trimStartPercent}%`, width: `${trimEndPercent - trimStartPercent}%` }"
          ></div>
          
          <div 
            class="absolute h-full bg-accent"
            :style="{ left: '0%', width: `${currentTimePercent}%` }"
          ></div>
          
          <div 
            class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow cursor-ew-resize border-2 border-accent hover:scale-110 transition-transform"
            :style="{ left: `calc(${trimStartPercent}% - 8px)` }"
            @mousedown.stop="startDrag($event, 'start')"
          ></div>
          
          <div 
            class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow cursor-ew-resize border-2 border-accent hover:scale-110 transition-transform"
            :style="{ left: `calc(${trimEndPercent}% - 8px)` }"
            @mousedown.stop="startDrag($event, 'end')"
          ></div>
        </div>
        
        <div class="flex items-center justify-between mt-2 text-sm">
          <div class="flex gap-4">
            <span class="text-gray-400">Start: <span class="text-white">{{ formatTime(videoStore.trimStart) }}</span></span>
            <span class="text-gray-400">End: <span class="text-white">{{ formatTime(videoStore.trimEnd) }}</span></span>
            <span class="text-gray-400">|</span>
            <span class="text-gray-400">Duration: <span class="text-accent">{{ formatTime(videoStore.trimDuration) }}</span></span>
          </div>
          
          <span>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        </div>
        
        <div class="flex items-center justify-center mt-3">
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