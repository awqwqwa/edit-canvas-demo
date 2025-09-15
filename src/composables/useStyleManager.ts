import { ref, reactive, computed } from 'vue'
import type { EditorObject, EditorTextObject, StyleConfig } from '@/type/element'

// 扩展 Canvas 类型以包含层级操作方法
interface FabricCanvasWithLayering {
  bringObjectToFront(object: unknown): void
  sendObjectToBack(object: unknown): void
  bringObjectForward(object: unknown): void
  sendObjectBackwards(object: unknown): void
}

export function useStyleManager() {
  const activeObject = ref<EditorObject | null>(null)

  // 当前样式配置
  const currentStyle = reactive<StyleConfig>({
    fontSize: 20,
    fontFamily: 'Arial',
    fontWeight: 400,
    color: '#000000',
    backgroundColor: '',
    opacity: 1,
    borderWidth: 0,
    borderColor: '#000000',
  })

  // 可用字体列表
  const fontFamilies = ref([
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Comic Sans MS',
    'Impact',
    'Arial Black',
    'Tahoma',
    'Trebuchet MS',
    'Lucida Console',
    '微软雅黑',
    '宋体',
    '黑体',
    '楷体',
    '隶书',
  ])

  // 字体大小选项
  const fontSizes = ref([8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96, 120, 144])

  // 字体粗细选项
  const fontWeights = ref([
    { label: '细体', value: 100 },
    { label: '特细', value: 200 },
    { label: '细', value: 300 },
    { label: '正常', value: 400 },
    { label: '中等', value: 500 },
    { label: '半粗', value: 600 },
    { label: '粗体', value: 700 },
    { label: '特粗', value: 800 },
    { label: '黑体', value: 900 },
  ])

  // 预设颜色
  const presetColors = ref([
    '#000000',
    '#ffffff',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
    '#808080',
    '#800000',
    '#808000',
    '#008000',
    '#800080',
    '#008080',
    '#000080',
    '#ffa500',
    '#ffc0cb',
    '#a52a2a',
    '#deb887',
    '#5f9ea0',
  ])

  // 计算属性：判断当前对象类型
  const isTextObject = computed(() => {
    return activeObject.value?.elementType === 'text'
  })

  const isImageObject = computed(() => {
    return activeObject.value?.elementType === 'image'
  })

  // 设置活动对象
  const setActiveObject = (obj: EditorObject | null) => {
    activeObject.value = obj

    if (obj) {
      updateCurrentStyle(obj)
    }
  }

  // 更新当前样式配置
  const updateCurrentStyle = (obj: EditorObject) => {
    if (obj.elementType === 'text') {
      const textObj = obj as EditorTextObject
      currentStyle.fontSize = textObj.fontSize || 20
      currentStyle.fontFamily = textObj.fontFamily || 'Arial'
      currentStyle.fontWeight = (textObj.fontWeight as number) || 400
      currentStyle.color = (textObj.fill as string) || '#000000'
      currentStyle.backgroundColor = (textObj.backgroundColor as string) || ''
    }

    currentStyle.opacity = obj.opacity || 1
    currentStyle.borderWidth = obj.strokeWidth || 0
    currentStyle.borderColor = (obj.stroke as string) || '#000000'
  }

  // 应用字体大小
  const applyFontSize = (fontSize: number) => {
    if (!activeObject.value || !isTextObject.value) return

    const textObj = activeObject.value as EditorTextObject
    textObj.set({ fontSize })
    currentStyle.fontSize = fontSize

    if (textObj.canvas) {
      textObj.canvas.renderAll()
    }
  }

  // 应用字体
  const applyFontFamily = (fontFamily: string) => {
    if (!activeObject.value || !isTextObject.value) return

    const textObj = activeObject.value as EditorTextObject
    textObj.set({ fontFamily })
    currentStyle.fontFamily = fontFamily

    if (textObj.canvas) {
      textObj.canvas.renderAll()
    }
  }

  // 应用字体粗细
  const applyFontWeight = (fontWeight: number) => {
    if (!activeObject.value || !isTextObject.value) return

    const textObj = activeObject.value as EditorTextObject
    textObj.set({ fontWeight })
    currentStyle.fontWeight = fontWeight

    if (textObj.canvas) {
      textObj.canvas.renderAll()
    }
  }

  // 应用文字颜色
  const applyTextColor = (color: string) => {
    if (!activeObject.value || !isTextObject.value) return

    const textObj = activeObject.value as EditorTextObject
    textObj.set({ fill: color })
    currentStyle.color = color

    if (textObj.canvas) {
      textObj.canvas.renderAll()
    }
  }

  // 应用背景颜色
  const applyBackgroundColor = (color: string) => {
    if (!activeObject.value) return

    if (isTextObject.value) {
      const textObj = activeObject.value as EditorTextObject
      textObj.set({ backgroundColor: color })
    }

    currentStyle.backgroundColor = color

    if (activeObject.value.canvas) {
      activeObject.value.canvas.renderAll()
    }
  }

  // 应用透明度
  const applyOpacity = (opacity: number) => {
    if (!activeObject.value) return

    const clampedOpacity = Math.max(0, Math.min(1, opacity))
    activeObject.value.set({ opacity: clampedOpacity })
    currentStyle.opacity = clampedOpacity

    if (activeObject.value.canvas) {
      activeObject.value.canvas.renderAll()
    }
  }

  // 应用边框宽度
  const applyBorderWidth = (width: number) => {
    if (!activeObject.value) return

    activeObject.value.set({ strokeWidth: width })
    currentStyle.borderWidth = width

    if (activeObject.value.canvas) {
      activeObject.value.canvas.renderAll()
    }
  }

  // 应用边框颜色
  const applyBorderColor = (color: string) => {
    if (!activeObject.value) return

    activeObject.value.set({ stroke: color })
    currentStyle.borderColor = color

    if (activeObject.value.canvas) {
      activeObject.value.canvas.renderAll()
    }
  }

  // 切换粗体
  const toggleBold = () => {
    if (!activeObject.value || !isTextObject.value) return

    const textObj = activeObject.value as EditorTextObject
    const currentWeight = (textObj.fontWeight as number) || 400
    const newWeight = currentWeight >= 700 ? 400 : 700

    applyFontWeight(newWeight)
  }

  // 切换斜体
  const toggleItalic = () => {
    if (!activeObject.value || !isTextObject.value) return

    const textObj = activeObject.value as EditorTextObject
    const isItalic = textObj.fontStyle === 'italic'
    textObj.set({ fontStyle: isItalic ? 'normal' : 'italic' })

    if (textObj.canvas) {
      textObj.canvas.renderAll()
    }
  }

  // 切换下划线
  const toggleUnderline = () => {
    if (!activeObject.value || !isTextObject.value) return

    const textObj = activeObject.value as EditorTextObject
    textObj.set({ underline: !textObj.underline })

    if (textObj.canvas) {
      textObj.canvas.renderAll()
    }
  }

  // 设置文本对齐
  const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (!activeObject.value || !isTextObject.value) return

    const textObj = activeObject.value as EditorTextObject
    textObj.set({ textAlign: align })

    if (textObj.canvas) {
      textObj.canvas.renderAll()
    }
  }

  // 对象层级操作
  const bringToFront = () => {
    if (!activeObject.value || !activeObject.value.canvas) return
    ;(activeObject.value.canvas as unknown as FabricCanvasWithLayering).bringObjectToFront(
      activeObject.value,
    )
    activeObject.value.canvas.renderAll()
  }

  const sendToBack = () => {
    if (!activeObject.value || !activeObject.value.canvas) return
    ;(activeObject.value.canvas as unknown as FabricCanvasWithLayering).sendObjectToBack(
      activeObject.value,
    )
    activeObject.value.canvas.renderAll()
  }

  const bringForward = () => {
    if (!activeObject.value || !activeObject.value.canvas) return
    ;(activeObject.value.canvas as unknown as FabricCanvasWithLayering).bringObjectForward(
      activeObject.value,
    )
    activeObject.value.canvas.renderAll()
  }

  const sendBackward = () => {
    if (!activeObject.value || !activeObject.value.canvas) return
    ;(activeObject.value.canvas as unknown as FabricCanvasWithLayering).sendObjectBackwards(
      activeObject.value,
    )
    activeObject.value.canvas.renderAll()
  }

  // 对象变换操作
  const flipHorizontal = () => {
    if (!activeObject.value) return

    activeObject.value.set({ flipX: !activeObject.value.flipX })

    if (activeObject.value.canvas) {
      activeObject.value.canvas.renderAll()
    }
  }

  const flipVertical = () => {
    if (!activeObject.value) return

    activeObject.value.set({ flipY: !activeObject.value.flipY })

    if (activeObject.value.canvas) {
      activeObject.value.canvas.renderAll()
    }
  }

  // 重置变换
  const resetTransform = () => {
    if (!activeObject.value) return

    activeObject.value.set({
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      flipX: false,
      flipY: false,
      skewX: 0,
      skewY: 0,
    })

    if (activeObject.value.canvas) {
      activeObject.value.canvas.renderAll()
    }
  }

  // 锁定/解锁对象
  const toggleLock = () => {
    if (!activeObject.value) return

    const isLocked = !activeObject.value.selectable
    activeObject.value.set({
      selectable: isLocked,
      evented: isLocked,
      lockMovementX: !isLocked,
      lockMovementY: !isLocked,
      lockRotation: !isLocked,
      lockScalingX: !isLocked,
      lockScalingY: !isLocked,
    })

    if (activeObject.value.canvas) {
      activeObject.value.canvas.renderAll()
    }
  }

  // 复制样式到其他对象
  const copyStyleTo = (targetObject: EditorObject) => {
    if (!activeObject.value || activeObject.value === targetObject) return

    if (activeObject.value.elementType === 'text' && targetObject.elementType === 'text') {
      const sourceText = activeObject.value as EditorTextObject
      const targetText = targetObject as EditorTextObject

      targetText.set({
        fontSize: sourceText.fontSize,
        fontFamily: sourceText.fontFamily,
        fontWeight: sourceText.fontWeight,
        fontStyle: sourceText.fontStyle,
        fill: sourceText.fill,
        backgroundColor: sourceText.backgroundColor,
        textAlign: sourceText.textAlign,
        underline: sourceText.underline,
        linethrough: sourceText.linethrough,
      })
    }

    // 通用样式
    targetObject.set({
      opacity: activeObject.value.opacity,
      strokeWidth: activeObject.value.strokeWidth,
      stroke: activeObject.value.stroke,
    })

    if (targetObject.canvas) {
      targetObject.canvas.renderAll()
    }
  }

  return {
    activeObject,
    currentStyle,
    fontFamilies,
    fontSizes,
    fontWeights,
    presetColors,
    isTextObject,
    isImageObject,
    setActiveObject,
    updateCurrentStyle,
    applyFontSize,
    applyFontFamily,
    applyFontWeight,
    applyTextColor,
    applyBackgroundColor,
    applyOpacity,
    applyBorderWidth,
    applyBorderColor,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    setTextAlign,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    flipHorizontal,
    flipVertical,
    resetTransform,
    toggleLock,
    copyStyleTo,
  }
}
