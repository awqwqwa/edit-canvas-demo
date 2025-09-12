<template>
  <div ref="canvas" style="border: 1px solid #ccc"></div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { fabric } from 'fabric'

const canvas = ref(null)

const initCanvas = () => {
  const canvasElement = canvas.value
  const canvasInstance = new fabric.Canvas(canvasElement)
  // 在这里初始化画布和图形
}

onMounted(() => {
  initCanvas()
})
</script>
