<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVideoStore } from '../stores/videoStore'

const videoStore = useVideoStore()
const trimMessage = ref('')

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00:00'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const canTrim = computed(() => {
  return videoStore.selectedVideo && 
         videoStore.trimEnd > videoStore.trimStart && 
         !videoStore.isProcessing &&
         videoStore.trimDuration >= 1
})

async function handleTrim() {
  if (!canTrim.value) return
  
  trimMessage.value = ''
  const result = await videoStore.trimVideo()
  
  if (result.success) {
    trimMessage.value = 'Video trimmed successfully!'
    setTimeout(() => { trimMessage.value = '' }, 3000)
  } else {
    trimMessage.value = `Error: ${result.error}`
  }
}

function handleStartChange(event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  if (value < videoStore.trimEnd - 1) {
    videoStore.setTrimRange(value, videoStore.trimEnd)
  }
}

function handleEndChange(event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  if (value > videoStore.trimStart + 1) {
    videoStore.setTrimRange(videoStore.trimStart, value)
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-4">
      <div class="flex-1">
        <label class="block text-xs text-gray-400 mb-1">Start Time</label>
        <div class="flex items-center gap-2">
          <input
            type="range"
            min="0"
            :max="videoStore.selectedVideo?.duration || 100"
            :value="videoStore.trimStart"
            step="0.1"
            @input="handleStartChange"
            class="w-full"
            :disabled="!videoStore.selectedVideo"
          />
          <span class="text-sm w-20 text-right">{{ formatTime(videoStore.trimStart) }}</span>
        </div>
      </div>
      
      <div class="flex-1">
        <label class="block text-xs text-gray-400 mb-1">End Time</label>
        <div class="flex items-center gap-2">
          <input
            type="range"
            min="0"
            :max="videoStore.selectedVideo?.duration || 100"
            :value="videoStore.trimEnd"
            step="0.1"
            @input="handleEndChange"
            class="w-full"
            :disabled="!videoStore.selectedVideo"
          />
          <span class="text-sm w-20 text-right">{{ formatTime(videoStore.trimEnd) }}</span>
        </div>
      </div>
    </div>
    
    <div class="flex items-center justify-between">
      <div class="text-sm">
        <span class="text-gray-400">Trim Duration: </span>
        <span class="text-accent">{{ formatTime(videoStore.trimDuration) }}</span>
      </div>
      
      <button
        @click="handleTrim"
        :disabled="!canTrim"
        class="px-6 py-2 bg-accent text-white rounded font-medium transition-colors"
        :class="{
          'hover:bg-accent-hover cursor-pointer': canTrim,
          'bg-gray-600 cursor-not-allowed': !canTrim
        }"
      >
        {{ videoStore.isProcessing ? 'Processing...' : 'TRIM VIDEO' }}
      </button>
    </div>
    
    <div v-if="trimMessage" class="text-sm" :class="trimMessage.startsWith('Error') ? 'text-red-400' : 'text-green-400'">
      {{ trimMessage }}
    </div>
  </div>
</template>