<template>
  <div class="poster-editor">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-section">
        <button @click="addText" class="btn btn-primary">
          <span class="icon">T</span>
          添加文字
        </button>
        <label class="btn btn-primary">
          <span class="icon">📷</span>
          添加图片
          <input type="file" accept="image/*" @change="handleImageUpload" style="display: none" />
        </label>
      </div>

      <div class="toolbar-section">
        <button @click="undo" :disabled="!canUndo()" class="btn btn-secondary">
          <span class="icon">↶</span>
          撤销
        </button>
        <button @click="redo" :disabled="!canRedo()" class="btn btn-secondary">
          <span class="icon">↷</span>
          重做
        </button>
      </div>

      <div class="toolbar-section">
        <button @click="deleteActiveObject" :disabled="!state.activeObject" class="btn btn-danger">
          <span class="icon">🗑</span>
          删除
        </button>
        <button @click="clearCanvas" class="btn btn-danger">
          <span class="icon">🗑</span>
          清空
        </button>
      </div>

      <div class="toolbar-section">
        <label>
          背景色:
          <input type="color" :value="config.backgroundColor" @change="changeBackgroundColor" />
        </label>
        <label>
          缩放:
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            :value="config.zoom"
            @input="handleZoom"
          />
          {{ Math.round(config.zoom * 100) }}%
        </label>
      </div>

      <div class="toolbar-section">
        <button @click="exportImage" class="btn btn-success">
          <span class="icon">💾</span>
          导出图片
        </button>
        <button @click="exportJSON" class="btn btn-success">
          <span class="icon">💾</span>
          导出JSON
        </button>
      </div>
    </div>

    <!-- 主编辑区域 -->
    <div class="editor-container">
      <!-- 左侧属性面板 -->
      <div class="sidebar left-sidebar" v-if="state.activeObject">
        <h3>属性面板</h3>
        <PropertyPanel
          :active-object="state.activeObject as EditorObject"
          :on-style-change="saveState"
        />
      </div>

      <!-- 中央画布区域 -->
      <div class="canvas-container">
        <div class="canvas-wrapper" :style="canvasWrapperStyle">
          <canvas
            ref="canvasRef"
            class="fabric-canvas"
            :width="config.width"
            :height="config.height"
          ></canvas>
        </div>

        <!-- 画布信息 -->
        <div class="canvas-info">
          <span>{{ config.width }} x {{ config.height }}px</span>
          <span v-if="state.activeObject"> 选中: {{ state.activeObject.elementType }} </span>
        </div>
      </div>

      <!-- 右侧工具面板 -->
      <div class="sidebar right-sidebar">
        <h3>图层</h3>
        <div class="layers-panel">
          <div
            v-for="element in state.elements"
            :key="element.id"
            :class="['layer-item', { active: state.selectedElementId === element.id }]"
            @click="selectElement(element.id)"
          >
            <span class="layer-icon">
              {{ element.type === 'text' ? '📝' : '🖼' }}
            </span>
            <span class="layer-name">
              {{
                element.type === 'text'
                  ? (element as TextElement).text.substring(0, 10) + '...'
                  : '图片'
              }}
            </span>
            <button @click.stop="deleteElement(element.id)" class="delete-btn">×</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useEditor } from '@/composables/useEditor'
import { useTextHandler } from '@/composables/useTextHandler'
import { useImageHandler } from '@/composables/useImageHandler'
import { useStyleManager } from '@/composables/useStyleManager'
import PropertyPanel from './PropertyPanel.vue'
import type { TextElement, ImageElement, EditorObject } from '@/type/element'

const canvasRef = ref<HTMLCanvasElement>()

// 使用composables
const {
  canvas,
  state,
  config,
  initCanvas,
  addElementToCanvas,
  deleteActiveObject,
  clearCanvas,
  setCanvasBackground,
  zoomCanvas,
  exportCanvasToJSON,
  exportCanvasToImage,
  saveState,
  undo,
  redo,
  canUndo,
  canRedo,
} = useEditor()

const {
  createTextObject,
  createTextFromElement,
  convertToElement: convertTextToElement,
} = useTextHandler()

const {
  createImageObject,
  createImageFromElement,
  convertToElement: convertImageToElement,
} = useImageHandler()

const { setActiveObject, currentStyle } = useStyleManager(saveState)

// 计算属性
const canvasWrapperStyle = computed(() => ({
  transform: `scale(${config.zoom})`,
  transformOrigin: 'center center',
}))

// 初始化编辑器
onMounted(async () => {
  if (!canvasRef.value) return

  const canvas = initCanvas(canvasRef.value)

  // 监听对象选中变化
  canvas.on('selection:created', (e) => {
    const obj = e.selected?.[0] as EditorObject
    if (obj) {
      setActiveObject(obj)
    }
  })

  canvas.on('selection:updated', (e) => {
    const obj = e.selected?.[0] as EditorObject
    if (obj) {
      setActiveObject(obj)
    }
  })

  canvas.on('selection:cleared', () => {
    setActiveObject(null)
  })

  // 监听对象修改后保存状态
  canvas.on('object:modified', () => {
    saveState()
  })
})

// 添加文本
const addText = async () => {
  const textObj = createTextObject('双击编辑文本', {
    left: 100 + Math.random() * 200,
    top: 100 + Math.random() * 200,
  })

  addElementToCanvas(textObj)

  // 添加到elements数组
  const textElement = convertTextToElement(textObj)
  state.elements.push(textElement)

  await nextTick()
  saveState()
}

// 处理图片上传
const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    const src = e.target?.result as string

    try {
      const imageObj = await createImageObject(src, {
        left: 100 + Math.random() * 200,
        top: 100 + Math.random() * 200,
      })

      addElementToCanvas(imageObj)

      // 添加到elements数组
      const imageElement = convertImageToElement(imageObj)
      state.elements.push(imageElement)

      await nextTick()
      saveState()
    } catch (error) {
      console.error('加载图片失败:', error)
    }
  }

  reader.readAsDataURL(file)

  // 重置输入框
  target.value = ''
}

// 选择元素
const selectElement = (elementId: string) => {
  if (!canvas.value) return

  const objects = canvas.value.getObjects() as EditorObject[]
  const targetObject = objects.find((obj) => obj.id === elementId)

  if (targetObject) {
    canvas.value.setActiveObject(targetObject)
    canvas.value.renderAll()
  }
}

// 删除元素
const deleteElement = (elementId: string) => {
  if (!canvas.value) return

  const objects = canvas.value.getObjects() as EditorObject[]
  const targetObject = objects.find((obj) => obj.id === elementId)

  if (targetObject) {
    canvas.value.remove(targetObject)
    canvas.value.renderAll()

    // 从elements数组中移除
    const elementIndex = state.elements.findIndex((el) => el.id === elementId)
    if (elementIndex !== -1) {
      state.elements.splice(elementIndex, 1)
    }

    saveState()
  }
}

// 改变背景色
const changeBackgroundColor = (event: Event) => {
  const target = event.target as HTMLInputElement
  setCanvasBackground(target.value)
  saveState()
}

// 处理缩放
const handleZoom = (event: Event) => {
  const target = event.target as HTMLInputElement
  zoomCanvas(parseFloat(target.value))
}

// 处理样式变化
const handleStyleChange = (changes: any) => {
  // 样式变化会通过PropertyPanel组件传递过来
  saveState()
}

// 导出图片
const exportImage = () => {
  const dataURL = exportCanvasToImage('png', 1)
  if (dataURL) {
    const link = document.createElement('a')
    link.download = `poster_${Date.now()}.png`
    link.href = dataURL
    link.click()
  }
}

// 导出JSON
const exportJSON = () => {
  const json = exportCanvasToJSON()
  if (json) {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `poster_${Date.now()}.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }
}
</script>

<style scoped>
.poster-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 20px;
  background: white;
  border-bottom: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4285f4;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3367d6;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.icon {
  font-size: 16px;
}

.editor-container {
  flex: 1;
  display: flex;
  min-height: 0;
}

.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #ddd;
  padding: 20px;
  overflow-y: auto;
}

.left-sidebar {
  border-right: 1px solid #ddd;
}

.right-sidebar {
  border-left: 1px solid #ddd;
}

.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
  background: #e9ecef;
}

.canvas-wrapper {
  display: inline-block;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.fabric-canvas {
  display: block;
}

.canvas-info {
  margin-top: 15px;
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.layers-panel {
  max-height: 400px;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 4px;
  transition: all 0.2s;
}

.layer-item:hover {
  background: #f8f9fa;
}

.layer-item.active {
  background: #e3f2fd;
  border-color: #4285f4;
}

.layer-icon {
  font-size: 16px;
}

.layer-name {
  flex: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background: #c82333;
}

input[type='color'] {
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

input[type='range'] {
  width: 100px;
}

label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}
</style>
