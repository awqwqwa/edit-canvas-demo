import { ref, nextTick } from 'vue'
import { Control, controlsUtils, Textbox } from 'fabric'
import type { EditorTextObject, TextElement } from '@/type/element'

export function useTextHandler() {
  const isEditing = ref(false)
  const currentEditingText = ref<EditorTextObject | null>(null)

  // 创建文本对象
  const createTextObject = (
    text: string = '双击编辑文本',
    options: {
      left?: number
      top?: number
      fontSize?: number
      fontFamily?: string
      fontWeight?: number | string
      fill?: string
      backgroundColor?: string
      textAlign?: string
      id?: string
    } = {},
  ): EditorTextObject => {
    const textObject = new Textbox(text, {
      left: options.left || 100,
      top: options.top || 100,
      fontSize: options.fontSize || 20,
      fontFamily: options.fontFamily || 'Arial',
      fontWeight: options.fontWeight || 'normal',
      fill: options.fill || '#000000',
      backgroundColor: options.backgroundColor || '',
      textAlign: options.textAlign || 'left',
      cornerStyle: 'rect',
      cornerSize: 0,
      borderColor: 'red',
      cornerColor: 'red',
      cornerStrokeColor: 'red',
      borderScaleFactor: 2,
      transparentCorners: false,
      editable: true,
      // 启用双击编辑
      doubleClickToEdit: true,
      // 确保控制点可见
      hasControls: true,
      hasBorders: true,
      hasRotatingPoint: true,
      // 文本只能等比例缩放
      lockScalingX: false,
      lockScalingY: false,
      // 启用文本自动换行
      splitByGrapheme: true,
      width: 100, // 设置默认宽度
      ...options,
    })

    // 设置自定义属性
    ;(textObject as unknown as EditorTextObject).id = options.id || `text_${Date.now()}`
    ;(textObject as unknown as EditorTextObject).elementType = 'text'
    ;(textObject as unknown as EditorTextObject).isEditable = true

    setupTextControls(textObject as unknown as EditorTextObject)
    // 设置文本编辑事件
    setupTextEvents(textObject as unknown as EditorTextObject)

    return textObject as unknown as EditorTextObject
  }

  // 自定义旋转控制器样式
  const setupCustomMtrControl = (textObject: EditorTextObject) => {
    // 自定义旋转控制器的渲染函数
    function renderCustomRotateIcon(
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number,
      styleOverride: unknown,
      fabricObject: EditorTextObject,
    ) {
      const size = 24
      const radius = size / 2

      ctx.save()
      ctx.translate(left, top)
      ctx.rotate(((fabricObject.angle || 0) * Math.PI) / 180)

      // 绘制外圆背景
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, 2 * Math.PI)
      ctx.fillStyle = '#4285f4'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // 绘制旋转箭头图标
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'

      // 圆弧箭头
      ctx.beginPath()
      ctx.arc(0, 0, 8, -Math.PI * 0.3, Math.PI * 0.9, false)
      ctx.stroke()

      // 箭头头部
      const arrowX = 8 * Math.cos(Math.PI * 0.9)
      const arrowY = 8 * Math.sin(Math.PI * 0.9)
      ctx.beginPath()
      ctx.moveTo(arrowX - 3, arrowY - 1)
      ctx.lineTo(arrowX + 1, arrowY - 1)
      ctx.lineTo(arrowX - 1, arrowY + 3)
      ctx.stroke()

      ctx.restore()
    }

    // 创建自定义旋转控制器
    textObject.controls.mtr = new Control({
      x: 0,
      y: -0.5,
      offsetY: -35, // 距离对象的距离
      cursorStyleHandler: controlsUtils.rotationStyleHandler,
      actionHandler: controlsUtils.rotationWithSnapping,
      actionName: 'rotate',
      render: renderCustomRotateIcon,
    })
  }

  // 设置图片控制点
  const setupTextControls = (textObject: EditorTextObject) => {
    // 确保所有控制点都可见

    textObject.setControlsVisibility({
      tl: true, // 左上角
      tr: true, // 右上角
      br: true, // 右下角
      bl: true, // 左下角
      ml: true, // 左边中点
      mr: true, // 右边中点
      mt: true, // 上边中点
      mb: true, // 下边中点
      mtr: true, // 旋转控制点
    })

    // 设置自定义旋转控制器
    setupCustomMtrControl(textObject)
  }
  // 设置文本事件处理
  const setupTextEvents = (textObject: EditorTextObject) => {
    // 双击进入编辑模式

    textObject.on('mousedblclick', () => {
      enterEditMode(textObject)
    })

    // 缩放结束后处理尺寸变化，保持锚点固定
    textObject.on('modified', () => {
      if (textObject.type === 'textbox') {
        const { scaleX = 1, scaleY = 1 } = textObject

        // 只有当缩放因子不为1时才处理
        if (Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01) {
          // 获取当前的尺寸信息
          const originalWidth = textObject.width || 100
          const originalHeight = textObject.height || 50
          const originalFontSize = textObject.fontSize || 16

          // 判断是否为整体缩放（四角锚点同时缩放）
          const isUniformScaling = Math.abs(scaleX - 1) > 0.01 && Math.abs(scaleY - 1) > 0.01

          if (!isUniformScaling) {
            // ---- 单方向缩放：只改宽/高，不缩放文字 ----
            const newWidth = originalWidth * scaleX
            const newHeight = originalHeight * scaleY

            textObject.set({
              width: newWidth,
              height: newHeight,
              scaleX: 1,
              scaleY: 1,
            })
          } else {
            // ---- 整体缩放：文字和框一起等比例缩放 ----
            const scaleFactor = Math.min(scaleX, scaleY) // 使用较小的缩放因子保持比例
            const newWidth = originalWidth * scaleFactor
            const newHeight = originalHeight * scaleFactor
            const newFontSize = Math.max(8, Math.round(originalFontSize * scaleFactor)) // 最小字体8px

            textObject.set({
              width: newWidth,
              height: newHeight,
              fontSize: newFontSize,
              scaleX: 1,
              scaleY: 1,
            })
          }

          textObject.setCoords()
          if (textObject.canvas) {
            textObject.canvas.renderAll()
          }
        }
      }
    })

    // 编辑开始事件
    textObject.on('editing:entered', () => {
      isEditing.value = true
      currentEditingText.value = textObject

      // 隐藏控制框
      textObject.set({
        borderColor: 'transparent',
        cornerColor: 'transparent',
      })

      if (textObject.canvas) {
        textObject.canvas.renderAll()
      }
    })

    // 编辑结束事件
    textObject.on('editing:exited', () => {
      exitEditMode(textObject)
    })

    // 文本改变事件
    textObject.on('changed', () => {
      if (textObject.canvas) {
        textObject.canvas.renderAll()
      }
    })

    // 选中事件
    textObject.on('selected', () => {
      if (!isEditing.value) {
        showTextControls(textObject)
      }
    })

    // 失焦事件
    textObject.on('deselected', () => {
      hideTextControls(textObject)
    })
  }

  // 进入编辑模式
  const enterEditMode = async (textObject: EditorTextObject) => {
    if (!textObject.canvas) return

    isEditing.value = true
    currentEditingText.value = textObject

    // 设置为编辑模式
    textObject.enterEditing()
    textObject.selectAll()

    // 隐藏其他对象的控制框
    textObject.canvas.getObjects().forEach((obj) => {
      if (obj !== textObject) {
        obj.set({
          selectable: false,
          evented: false,
        })
      }
    })

    await nextTick()
    textObject.canvas.renderAll()
  }

  // 退出编辑模式
  const exitEditMode = (textObject: EditorTextObject) => {
    if (!textObject.canvas) return

    isEditing.value = false
    currentEditingText.value = null

    // 退出编辑模式
    textObject.exitEditing()

    // 恢复控制框样式
    textObject.set({
      borderColor: '#4285f4',
      cornerColor: '#4285f4',
    })

    // 恢复其他对象的交互
    textObject.canvas.getObjects().forEach((obj) => {
      if (obj !== textObject) {
        obj.set({
          selectable: true,
          evented: true,
        })
      }
    })

    textObject.canvas.renderAll()
  }

  // 显示文本控制框
  const showTextControls = (textObject: EditorTextObject) => {
    textObject.set({
      borderColor: '#4285f4',
      cornerColor: '#4285f4',
      transparentCorners: false,
    })

    if (textObject.canvas) {
      textObject.canvas.renderAll()
    }
  }

  // 隐藏文本控制框
  const hideTextControls = (textObject: EditorTextObject) => {
    if (!isEditing.value) {
      textObject.set({
        borderColor: 'transparent',
        cornerColor: 'transparent',
      })

      if (textObject.canvas) {
        textObject.canvas.renderAll()
      }
    }
  }

  // 设置文本样式
  const setTextStyle = (
    textObject: EditorTextObject,
    style: {
      fontSize?: number
      fontFamily?: string
      fontWeight?: number | string
      fontStyle?: string
      fill?: string
      backgroundColor?: string
      textAlign?: string
      textDecoration?: string
      lineHeight?: number
    },
  ) => {
    textObject.set(style)

    if (textObject.canvas) {
      textObject.canvas.renderAll()
    }
  }

  // 设置文本内容
  const setText = (textObject: EditorTextObject, text: string) => {
    textObject.set({ text })

    if (textObject.canvas) {
      textObject.canvas.renderAll()
    }
  }

  // 设置文本对齐方式
  const setTextAlign = (
    textObject: EditorTextObject,
    align: 'left' | 'center' | 'right' | 'justify',
  ) => {
    textObject.set({ textAlign: align })

    if (textObject.canvas) {
      textObject.canvas.renderAll()
    }
  }

  // 设置字体粗细
  const setFontWeight = (textObject: EditorTextObject, weight: number | string) => {
    textObject.set({ fontWeight: weight })

    if (textObject.canvas) {
      textObject.canvas.renderAll()
    }
  }

  // 设置斜体
  const setFontStyle = (textObject: EditorTextObject, style: 'normal' | 'italic') => {
    textObject.set({ fontStyle: style })

    if (textObject.canvas) {
      textObject.canvas.renderAll()
    }
  }

  // 设置下划线
  const setTextDecoration = (
    textObject: EditorTextObject,
    decoration: 'none' | 'underline' | 'line-through',
  ) => {
    const underline = decoration === 'underline'
    const linethrough = decoration === 'line-through'

    textObject.set({
      underline,
      linethrough,
    })

    if (textObject.canvas) {
      textObject.canvas.renderAll()
    }
  }

  // 设置行高
  const setLineHeight = (textObject: EditorTextObject, lineHeight: number) => {
    textObject.set({ lineHeight })

    if (textObject.canvas) {
      textObject.canvas.renderAll()
    }
  }

  // 添加文本阴影
  const setTextShadow = (
    textObject: EditorTextObject,
    shadow: {
      color?: string
      blur?: number
      offsetX?: number
      offsetY?: number
    } | null,
  ) => {
    if (shadow) {
      textObject.set({
        shadow: {
          color: shadow.color || 'rgba(0,0,0,0.3)',
          blur: shadow.blur || 5,
          offsetX: shadow.offsetX || 2,
          offsetY: shadow.offsetY || 2,
        },
      })
    } else {
      textObject.set({ shadow: null })
    }

    if (textObject.canvas) {
      textObject.canvas.renderAll()
    }
  }

  // 复制文本样式
  const copyTextStyle = (sourceText: EditorTextObject, targetText: EditorTextObject) => {
    const style = {
      fontSize: sourceText.fontSize,
      fontFamily: sourceText.fontFamily,
      fontWeight: sourceText.fontWeight,
      fontStyle: sourceText.fontStyle,
      fill: sourceText.fill as string,
      backgroundColor: sourceText.backgroundColor as string,
      textAlign: sourceText.textAlign,
      lineHeight: sourceText.lineHeight,
    }

    // 直接设置样式
    targetText.set(style)

    if (targetText.canvas) {
      targetText.canvas.renderAll()
    }
  }

  // 从TextElement创建Fabric对象
  const createTextFromElement = (element: TextElement): EditorTextObject => {
    return createTextObject(element.text, {
      left: element.x,
      top: element.y,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      fontWeight: element.fontWeight,
      fill: element.color,
      backgroundColor: element.background,
      textAlign: element.textAlign,
      id: element.id,
    })
  }

  // 将Fabric对象转换为TextElement
  const convertToElement = (textObject: EditorTextObject): TextElement => {
    return {
      id: textObject.id,
      type: 'text',
      text: textObject.text || '',
      x: textObject.left || 0,
      y: textObject.top || 0,
      width: textObject.width || 0,
      height: textObject.height || 0,
      rotation: textObject.angle || 0,
      zIndex: 0,
      opacity: textObject.opacity || 1,
      radius: '0',
      fontSize: textObject.fontSize || 20,
      fontWeight: typeof textObject.fontWeight === 'number' ? textObject.fontWeight : 400,
      fontStyle: textObject.fontStyle || 'normal',
      fontFamily: textObject.fontFamily || 'Arial',
      color: (textObject.fill as string) || '#000000',
      background: (textObject.backgroundColor as string) || '',
      textAlign: textObject.textAlign || 'left',
      textDecoration: textObject.underline
        ? 'underline'
        : textObject.linethrough
          ? 'line-through'
          : 'none',
      textTransform: 'none',
      textOverflow: 'visible',
    }
  }

  // 强制退出编辑模式
  const forceExitEdit = () => {
    if (isEditing.value && currentEditingText.value) {
      exitEditMode(currentEditingText.value as EditorTextObject)
    }
  }

  return {
    isEditing,
    currentEditingText,
    createTextObject,
    setupTextEvents,
    enterEditMode,
    exitEditMode,
    setTextStyle,
    setText,
    setTextAlign,
    setFontWeight,
    setFontStyle,
    setTextDecoration,
    setLineHeight,
    setTextShadow,
    copyTextStyle,
    createTextFromElement,
    convertToElement,
    forceExitEdit,
  }
}
