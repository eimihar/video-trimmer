<script setup lang="ts">
import { useVideoStore } from '../stores/videoStore'

const videoStore = useVideoStore()
</script>

<template>
  <div class="h-8 bg-panel-bg border-t border-gray-700 px-4 flex items-center justify-between text-xs">
    <span>{{ videoStore.status }}</span>
    
    <div v-if="videoStore.isProcessing" class="flex items-center gap-2">
      <div class="w-32 h-1 bg-gray-700 rounded overflow-hidden">
        <div 
          class="h-full bg-accent transition-all duration-300"
          :style="{ width: `${videoStore.progress}%` }"
        ></div>
      </div>
      <span>{{ videoStore.progress }}%</span>
    </div>
  </div>
</template>