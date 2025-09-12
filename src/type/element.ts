import type {
  Object as FabricObject,
  Canvas,
  Image as FabricImage,
  IText as FabricIText,
} from 'fabric'

interface BaseElement {
  id: string
  type: string
  x: number
  y: number
  rotation: number
  zIndex: number
  width: number
  height: number
  opacity: number
  radius: string
  parentId?: string // 考虑元素组
}

export interface TextElement extends BaseElement {
  text: string
  fontSize: number
  fontWeight: number
  fontStyle: string
  fontFamily: string
  color: string
  background: string
  textAlign: string
  textDecoration: string
  textTransform: string
  textOverflow: string
}

export interface ImageElement extends BaseElement {
  src: string
  alt: string
  scaleX?: number
  scaleY?: number
  lockUniScaling?: boolean // 锁定等比例缩放
}

// Fabric.js相关类型扩展
export interface EditorCanvas extends Canvas {
  isDragging?: boolean
  lastPosX?: number
  lastPosY?: number
}

export interface EditorObject extends FabricObject {
  id: string
  elementType: 'text' | 'image' | 'shape'
  isEditable?: boolean
}

export interface EditorTextObject extends FabricIText {
  id: string
  elementType: 'text'
  isEditable: boolean
}

export interface EditorImageObject extends FabricImage {
  id: string
  elementType: 'image'
  originalWidth?: number
  originalHeight?: number
}

// 编辑器状态
export interface EditorState {
  activeObject: EditorObject | null
  elements: (TextElement | ImageElement)[]
  selectedElementId: string | null
  isTextEditing: boolean
}

// 样式配置
export interface StyleConfig {
  fontSize: number
  fontFamily: string
  fontWeight: number
  color: string
  backgroundColor: string
  opacity: number
  borderWidth: number
  borderColor: string
}

// 编辑器配置
export interface EditorConfig {
  width: number
  height: number
  backgroundColor: string
  zoom: number
  showGrid: boolean
}
