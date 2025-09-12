import { ref } from 'vue'
import { FabricImage } from 'fabric'
import type { EditorImageObject, ImageElement } from '@/type/element'

export function useImageHandler() {
  const isLoading = ref(false)

  // 创建图片对象
  const createImageObject = async (
    src: string,
    options: {
      left?: number
      top?: number
      scaleX?: number
      scaleY?: number
      id?: string
    } = {},
  ): Promise<EditorImageObject> => {
    isLoading.value = true

    return new Promise((resolve, reject) => {
      FabricImage.fromURL(src, {
        crossOrigin: 'anonymous',
      })
        .then((img) => {
          const imageObject = img as EditorImageObject

          // 设置基本属性
          imageObject.set({
            left: options.left || 100,
            top: options.top || 100,
            scaleX: options.scaleX || 1,
            scaleY: options.scaleY || 1,
            cornerStyle: 'circle',
            cornerSize: 12,
            borderColor: '#4285f4',
            cornerColor: '#4285f4',
            borderScaleFactor: 2,
            transparentCorners: false,
            // 启用所有控制功能
            hasRotatingPoint: true,
            hasControls: true,
            hasBorders: true,
            // 解锁所有缩放限制，允许自由缩放
            lockScalingX: false,
            lockScalingY: false,
            lockUniScaling: false, // 允许非等比例缩放
            // 启用所有控制点
            selectable: true,
            evented: true,
            ...options,
          })

          // 设置自定义属性
          imageObject.id = options.id || `img_${Date.now()}`
          imageObject.elementType = 'image'
          imageObject.originalWidth = imageObject.width
          imageObject.originalHeight = imageObject.height

          // 设置控制点的特殊行为
          setupImageControls(imageObject)

          // 添加缩放事件监听
          setupScalingEvents(imageObject)

          isLoading.value = false
          resolve(imageObject)
        })
        .catch((error) => {
          isLoading.value = false
          reject(error)
        })
    })
  }

  // 设置图片控制点
  const setupImageControls = (imageObject: EditorImageObject) => {
    // 确保所有控制点都可见
    imageObject.setControlsVisibility({
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

    // 设置旋转控制点位置
    if (imageObject.controls.mtr) {
      imageObject.controls.mtr.offsetY = -40
    }
  }

  // 设置缩放事件
  const setupScalingEvents = (imageObject: EditorImageObject) => {
    let scalingCorner = ''

    // 记录开始缩放时的状态
    imageObject.on('scaling', () => {
      const corner = (imageObject as EditorImageObject).__corner

      scalingCorner = corner || ''

      // 根据控制点类型设置缩放行为
      if (['tl', 'tr', 'br', 'bl'].includes(scalingCorner)) {
        // 四角控制点：等比例缩放
        const scaleX = imageObject.scaleX || 1
        const scaleY = imageObject.scaleY || 1
        const scale = Math.max(Math.abs(scaleX), Math.abs(scaleY))

        imageObject.set({
          scaleX: scaleX < 0 ? -scale : scale,
          scaleY: scaleY < 0 ? -scale : scale,
        })
      }
      // 四边控制点自然行为就是单向拉伸，不需要特别设置
    })

    // 缩放结束后重新渲染
    imageObject.on('modified', () => {
      scalingCorner = ''
      if (imageObject.canvas) {
        imageObject.canvas.renderAll()
      }
    })

    // 鼠标按下时记录控制点
    imageObject.on('mousedown', () => {
      if ((imageObject as EditorImageObject).__corner) {
        scalingCorner = (imageObject as EditorImageObject).__corner || ''
      }
    })
  }

  // 重置图片大小到原始尺寸
  const resetImageSize = (imageObject: EditorImageObject) => {
    if (imageObject.originalWidth && imageObject.originalHeight) {
      imageObject.set({
        scaleX: 1,
        scaleY: 1,
        width: imageObject.originalWidth,
        height: imageObject.originalHeight,
      })

      if (imageObject.canvas) {
        imageObject.canvas.renderAll()
      }
    }
  }

  // 等比例缩放到指定宽度
  const scaleImageToWidth = (imageObject: EditorImageObject, targetWidth: number) => {
    if (!imageObject.originalWidth || !imageObject.originalHeight) return

    const scale = targetWidth / imageObject.originalWidth
    imageObject.set({
      scaleX: scale,
      scaleY: scale,
    })

    if (imageObject.canvas) {
      imageObject.canvas.renderAll()
    }
  }

  // 等比例缩放到指定高度
  const scaleImageToHeight = (imageObject: EditorImageObject, targetHeight: number) => {
    if (!imageObject.originalWidth || !imageObject.originalHeight) return

    const scale = targetHeight / imageObject.originalHeight
    imageObject.set({
      scaleX: scale,
      scaleY: scale,
    })

    if (imageObject.canvas) {
      imageObject.canvas.renderAll()
    }
  }

  // 设置图片透明度
  const setImageOpacity = (imageObject: EditorImageObject, opacity: number) => {
    imageObject.set({
      opacity: Math.max(0, Math.min(1, opacity)),
    })

    if (imageObject.canvas) {
      imageObject.canvas.renderAll()
    }
  }

  // 翻转图片
  const flipImage = (imageObject: EditorImageObject, axis: 'x' | 'y') => {
    if (axis === 'x') {
      imageObject.set({
        flipX: !imageObject.flipX,
      })
    } else {
      imageObject.set({
        flipY: !imageObject.flipY,
      })
    }

    if (imageObject.canvas) {
      imageObject.canvas.renderAll()
    }
  }

  // 锁定等比例缩放
  const setUniformScaling = (imageObject: EditorImageObject, uniform: boolean) => {
    imageObject.set({
      lockUniScaling: uniform,
    })

    if (imageObject.canvas) {
      imageObject.canvas.renderAll()
    }
  }

  // 从ImageElement创建Fabric对象
  const createImageFromElement = async (element: ImageElement): Promise<EditorImageObject> => {
    return createImageObject(element.src, {
      left: element.x,
      top: element.y,
      scaleX: element.scaleX || 1,
      scaleY: element.scaleY || 1,
      id: element.id,
    })
  }

  // 将Fabric对象转换为ImageElement
  const convertToElement = (imageObject: EditorImageObject): ImageElement => {
    return {
      id: imageObject.id,
      type: 'image',
      src: imageObject.getSrc(),
      alt: '',
      x: imageObject.left || 0,
      y: imageObject.top || 0,
      width: (imageObject.width || 0) * (imageObject.scaleX || 1),
      height: (imageObject.height || 0) * (imageObject.scaleY || 1),
      rotation: imageObject.angle || 0,
      zIndex: 0,
      opacity: imageObject.opacity || 1,
      radius: '0',
      scaleX: imageObject.scaleX,
      scaleY: imageObject.scaleY,
    }
  }

  return {
    isLoading,
    createImageObject,
    resetImageSize,
    scaleImageToWidth,
    scaleImageToHeight,
    setImageOpacity,
    flipImage,
    setUniformScaling,
    createImageFromElement,
    convertToElement,
  }
}
