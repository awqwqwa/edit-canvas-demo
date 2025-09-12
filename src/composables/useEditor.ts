import { ref, reactive, shallowRef, markRaw } from 'vue'
import { Canvas } from 'fabric'
import type {
  EditorCanvas,
  EditorConfig,
  EditorObject,
  TextElement,
  ImageElement,
} from '@/type/element'

export function useEditor() {
  // 使用shallowRef + markRaw处理canvas，避免响应式代理破坏Fabric.js交互
  const canvas = shallowRef<EditorCanvas | null>(null)

  const state = reactive({
    activeObject: null as EditorObject | null,
    elements: [] as (TextElement | ImageElement)[],
    selectedElementId: null as string | null,
    isTextEditing: false,
  })

  const config = reactive<EditorConfig>({
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    zoom: 1,
    showGrid: false,
  })

  // 初始化画布
  const initCanvas = (canvasElement: HTMLCanvasElement): EditorCanvas => {
    const fabricCanvas = new Canvas(canvasElement, {
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
    }) as EditorCanvas

    // 使用markRaw避免Vue响应式代理，保护Fabric.js原生交互能力
    canvas.value = markRaw(fabricCanvas)

    // 设置画布事件监听
    setupCanvasEvents(fabricCanvas)

    return fabricCanvas
  }

  // 设置画布事件
  const setupCanvasEvents = (canvas: EditorCanvas) => {
    // 选择对象事件
    canvas.on('selection:created', (e) => {
      const activeObject = e.selected?.[0] as EditorObject
      if (activeObject) {
        state.activeObject = activeObject
        state.selectedElementId = activeObject.id
      }
    })

    canvas.on('selection:updated', (e) => {
      const activeObject = e.selected?.[0] as EditorObject
      if (activeObject) {
        state.activeObject = activeObject
        state.selectedElementId = activeObject.id
      }
    })

    canvas.on('selection:cleared', () => {
      state.activeObject = null
      state.selectedElementId = null
      state.isTextEditing = false
    })

    // 对象修改事件
    canvas.on('object:modified', (e) => {
      const target = e.target as EditorObject
      if (target) {
        updateElementData(target)
      }
    })

    // 对象移动事件
    canvas.on('object:moving', (e) => {
      const target = e.target as EditorObject
      if (target) {
        // 可以在这里添加吸附等功能
      }
    })

    // 对象缩放事件
    canvas.on('object:scaling', (e) => {
      const target = e.target as EditorObject
      if (target && target.elementType === 'image') {
        // 图片缩放时的特殊处理
        handleImageScaling(target)
      }
    })
  }

  // 处理图片缩放
  const handleImageScaling = (target: EditorObject) => {
    // 图片缩放逻辑现在在useImageHandler中处理
    // 这里可以添加额外的缩放后处理逻辑
    updateElementData(target)
  }

  // 更新元素数据
  const updateElementData = (fabricObject: EditorObject) => {
    const elementIndex = state.elements.findIndex(
      (el) => el.id === (fabricObject as EditorObject).id,
    )
    if (elementIndex !== -1) {
      const element = state.elements[elementIndex]
      element.x = fabricObject.left || 0
      element.y = fabricObject.top || 0
      element.width = fabricObject.width || 0
      element.height = fabricObject.height || 0
      element.rotation = fabricObject.angle || 0
      element.opacity = fabricObject.opacity || 1
    }
  }

  // 添加元素到画布
  const addElementToCanvas = (fabricObject: EditorObject) => {
    if (!canvas.value) return

    canvas.value.add(fabricObject as EditorObject)
    canvas.value.setActiveObject(fabricObject as EditorObject)
    canvas.value.renderAll()

    state.activeObject = fabricObject
    state.selectedElementId = (fabricObject as EditorObject).id
  }

  // 删除选中的对象
  const deleteActiveObject = () => {
    if (!canvas.value || !state.activeObject) return

    canvas.value.remove(state.activeObject as EditorObject)
    canvas.value.renderAll()

    // 从elements数组中移除
    const elementIndex = state.elements.findIndex(
      (el) => el.id === (state.activeObject as EditorObject)!.id,
    )
    if (elementIndex !== -1) {
      state.elements.splice(elementIndex, 1)
    }

    state.activeObject = null
    state.selectedElementId = null
  }

  // 清空画布
  const clearCanvas = () => {
    if (!canvas.value) return

    canvas.value.clear()
    state.elements = []
    state.activeObject = null
    state.selectedElementId = null
    state.isTextEditing = false
  }

  // 设置画布背景颜色
  const setCanvasBackground = (color: string) => {
    if (!canvas.value) return

    config.backgroundColor = color
    canvas.value.backgroundColor = color
    canvas.value.renderAll()
  }

  // 缩放画布
  const zoomCanvas = (zoom: number) => {
    if (!canvas.value) return

    config.zoom = Math.max(0.1, Math.min(5, zoom))
    canvas.value.setZoom(config.zoom)
    canvas.value.renderAll()
  }

  // 导出画布为JSON
  const exportCanvasToJSON = () => {
    if (!canvas.value) return null
    return canvas.value.toJSON()
  }

  // 从JSON加载画布
  const loadCanvasFromJSON = (jsonData: string) => {
    if (!canvas.value) return

    canvas.value.loadFromJSON(jsonData).then(() => {
      canvas.value!.renderAll()
      // 重新绑定事件
      setupCanvasEvents(canvas.value! as EditorCanvas)
    })
  }

  // 导出为图片
  const exportCanvasToImage = (format: 'png' | 'jpeg' = 'png', quality = 1) => {
    if (!canvas.value) return null

    return canvas.value.toDataURL({
      format,
      quality,
      multiplier: 1,
    })
  }

  // 撤销/重做功能 (简单实现)
  const history = ref<string[]>([])
  const historyIndex = ref(-1)

  const saveState = () => {
    if (!canvas.value) return

    const currentState = exportCanvasToJSON()
    if (currentState) {
      history.value = history.value.slice(0, historyIndex.value + 1)
      history.value.push(currentState)
      historyIndex.value = history.value.length - 1

      // 限制历史记录数量
      if (history.value.length > 50) {
        history.value = history.value.slice(-50)
        historyIndex.value = history.value.length - 1
      }
    }
  }

  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      const prevState = history.value[historyIndex.value]
      loadCanvasFromJSON(prevState)
    }
  }

  const redo = () => {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      const nextState = history.value[historyIndex.value]
      loadCanvasFromJSON(nextState)
    }
  }

  const canUndo = () => historyIndex.value > 0
  const canRedo = () => historyIndex.value < history.value.length - 1

  return {
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
    loadCanvasFromJSON,
    exportCanvasToImage,
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
