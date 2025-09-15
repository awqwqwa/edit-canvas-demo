<template>
  <div class="property-panel">
    <!-- 基础属性 -->
    <div class="property-group">
      <h4>位置与大小</h4>
      <div class="property-row">
        <label>X:</label>
        <input
          type="number"
          :value="Math.round(activeObject.left || 0)"
          @input="updatePosition('left', $event)"
          class="input-small"
        />
      </div>
      <div class="property-row">
        <label>Y:</label>
        <input
          type="number"
          :value="Math.round(activeObject.top || 0)"
          @input="updatePosition('top', $event)"
          class="input-small"
        />
      </div>
      <div class="property-row">
        <label>宽:</label>
        <input
          type="number"
          :value="Math.round((activeObject.width || 0) * (activeObject.scaleX || 1))"
          @input="updateSize('width', $event)"
          class="input-small"
        />
      </div>
      <div class="property-row">
        <label>高:</label>
        <input
          type="number"
          :value="Math.round((activeObject.height || 0) * (activeObject.scaleY || 1))"
          @input="updateSize('height', $event)"
          class="input-small"
        />
      </div>
      <div class="property-row">
        <label>角度:</label>
        <input
          type="number"
          :value="Math.round(activeObject.angle || 0)"
          @input="updateRotation"
          class="input-small"
        />
      </div>
    </div>

    <!-- 外观属性 -->
    <div class="property-group">
      <h4>外观</h4>
      <div class="property-row">
        <label>透明度:</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="currentStyle.opacity"
          @input="styleManager.applyOpacity(parseFloat(($event.target as HTMLInputElement).value))"
        />
        <span>{{ Math.round(currentStyle.opacity * 100) }}%</span>
      </div>
    </div>

    <!-- 文字属性 -->
    <div v-if="styleManager.isTextObject.value" class="property-group">
      <h4>文字属性</h4>

      <!-- 字体大小 -->
      <div class="property-row">
        <label>字体大小:</label>
        <select
          :value="currentStyle.fontSize"
          onclick="console.log(styleManager.fontSize)"
          @change="styleManager.applyFontSize(parseInt(($event.target as HTMLSelectElement).value))"
          class="select-input"
        >
          <option
            v-if="!styleManager.fontSizes.value.includes(currentStyle.fontSize)"
            :value="currentStyle.fontSize"
          >
            {{ currentStyle.fontSize }}px
          </option>
          <option v-for="size in styleManager.fontSizes.value" :key="size" :value="size">
            {{ size }}px
          </option>
        </select>
      </div>

      <!-- 字体系列 -->
      <div class="property-row">
        <label>字体:</label>
        <select
          :value="currentStyle.fontFamily"
          @change="styleManager.applyFontFamily(($event.target as HTMLSelectElement).value)"
          class="select-input"
        >
          <option v-for="font in styleManager.fontFamilies.value" :key="font" :value="font">
            {{ font }}
          </option>
        </select>
      </div>

      <!-- 字体粗细 -->
      <div class="property-row">
        <label>字体粗细:</label>
        <select
          :value="currentStyle.fontWeight"
          @change="
            styleManager.applyFontWeight(parseInt(($event.target as HTMLSelectElement).value))
          "
          class="select-input"
        >
          <option
            v-for="weight in styleManager.fontWeights.value"
            :key="weight.value"
            :value="weight.value"
          >
            {{ weight.label }}
          </option>
        </select>
      </div>

      <!-- 文字颜色 -->
      <div class="property-row">
        <label>文字颜色:</label>
        <div class="color-input-group">
          <input
            type="color"
            :value="currentStyle.color"
            @change="styleManager.applyTextColor(($event.target as HTMLInputElement).value)"
            class="color-input"
          />
          <input
            type="text"
            :value="currentStyle.color"
            @change="styleManager.applyTextColor(($event.target as HTMLInputElement).value)"
            class="color-text-input"
          />
        </div>
      </div>

      <!-- 背景颜色 -->
      <div class="property-row">
        <label>背景颜色:</label>
        <div class="color-input-group">
          <input
            type="color"
            :value="currentStyle.backgroundColor || '#ffffff'"
            @change="styleManager.applyBackgroundColor(($event.target as HTMLInputElement).value)"
            class="color-input"
          />
          <input
            type="text"
            :value="currentStyle.backgroundColor"
            @change="styleManager.applyBackgroundColor(($event.target as HTMLInputElement).value)"
            class="color-text-input"
            placeholder="透明"
          />
        </div>
      </div>

      <!-- 预设颜色 -->
      <div class="property-row">
        <label>预设颜色:</label>
        <div class="color-preset-grid">
          <button
            v-for="color in styleManager.presetColors.value"
            :key="color"
            :style="{ backgroundColor: color }"
            @click="styleManager.applyTextColor(color)"
            class="color-preset-btn"
            :title="color"
          ></button>
        </div>
      </div>

      <!-- 文字样式按钮 -->
      <div class="property-row">
        <label>样式:</label>
        <div class="style-buttons">
          <button
            @click="styleManager.toggleBold()"
            :class="['style-btn', { active: currentStyle.fontWeight >= 700 }]"
            title="粗体"
          >
            B
          </button>
          <button
            @click="styleManager.toggleItalic()"
            :class="['style-btn', { active: isItalic }]"
            title="斜体"
          >
            I
          </button>
          <button
            @click="styleManager.toggleUnderline()"
            :class="['style-btn', { active: isUnderline }]"
            title="下划线"
          >
            U
          </button>
        </div>
      </div>

      <!-- 对齐方式 -->
      <div class="property-row">
        <label>对齐:</label>
        <div class="align-buttons">
          <button
            @click="styleManager.setTextAlign('left')"
            :class="['align-btn', { active: currentTextAlign === 'left' }]"
            title="左对齐"
          >
            ⬅
          </button>
          <button
            @click="styleManager.setTextAlign('center')"
            :class="['align-btn', { active: currentTextAlign === 'center' }]"
            title="居中"
          >
            ↔
          </button>
          <button
            @click="styleManager.setTextAlign('right')"
            :class="['align-btn', { active: currentTextAlign === 'right' }]"
            title="右对齐"
          >
            ➡
          </button>
        </div>
      </div>
    </div>

    <!-- 边框属性 -->
    <div class="property-group">
      <h4>边框</h4>
      <div class="property-row">
        <label>边框宽度:</label>
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          :value="currentStyle.borderWidth"
          @input="
            styleManager.applyBorderWidth(parseInt(($event.target as HTMLInputElement).value))
          "
        />
        <span>{{ currentStyle.borderWidth }}px</span>
      </div>
      <div class="property-row">
        <label>边框颜色:</label>
        <input
          type="color"
          :value="currentStyle.borderColor"
          @change="styleManager.applyBorderColor(($event.target as HTMLInputElement).value)"
          class="color-input"
        />
      </div>
    </div>

    <!-- 层级操作 -->
    <div class="property-group">
      <h4>层级</h4>
      <div class="layer-buttons">
        <button @click="styleManager.bringToFront()" class="btn btn-small" title="置于顶层">
          ⬆⬆
        </button>
        <button @click="styleManager.bringForward()" class="btn btn-small" title="上一层">
          ⬆
        </button>
        <button @click="styleManager.sendBackward()" class="btn btn-small" title="下一层">
          ⬇
        </button>
        <button @click="styleManager.sendToBack()" class="btn btn-small" title="置于底层">
          ⬇⬇
        </button>
      </div>
    </div>

    <!-- 变换操作 -->
    <div class="property-group">
      <h4>变换</h4>
      <div class="transform-buttons">
        <button @click="styleManager.flipHorizontal()" class="btn btn-small" title="水平翻转">
          ↔
        </button>
        <button @click="styleManager.flipVertical()" class="btn btn-small" title="垂直翻转">
          ↕
        </button>
        <button @click="styleManager.resetTransform()" class="btn btn-small" title="重置变换">
          🔄
        </button>
      </div>
    </div>

    <!-- 锁定操作 -->
    <div class="property-group">
      <h4>锁定</h4>
      <button
        @click="styleManager.toggleLock()"
        :class="['btn', isLocked ? 'btn-danger' : 'btn-secondary']"
      >
        {{ isLocked ? '🔒 解锁' : '🔓 锁定' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStyleManager } from '@/composables/useStyleManager'
import type { EditorObject, EditorTextObject } from '@/type/element'

interface Props {
  activeObject: EditorObject
}

const props = defineProps<Props>()

interface StyleChangeEvent {
  [key: string]: unknown
}

const emit = defineEmits<{
  styleChange: [changes: StyleChangeEvent]
}>()

const styleManager = useStyleManager()

// 设置活动对象
styleManager.setActiveObject(props.activeObject)

// 监听activeObject变化并同步到styleManager
watch(
  () => props.activeObject,
  (newActiveObject) => {
    if (newActiveObject) {
      styleManager.setActiveObject(newActiveObject)
    }
  },
  { deep: true, immediate: true },
)

// 计算属性
const currentStyle = computed(() => styleManager.currentStyle)

const isItalic = computed(() => {
  if (styleManager.isTextObject.value) {
    const textObj = props.activeObject as EditorTextObject
    return textObj.fontStyle === 'italic'
  }
  return false
})

const isUnderline = computed(() => {
  if (styleManager.isTextObject.value) {
    const textObj = props.activeObject as EditorTextObject
    return textObj.underline
  }
  return false
})

const currentTextAlign = computed(() => {
  if (styleManager.isTextObject.value) {
    const textObj = props.activeObject as EditorTextObject
    return textObj.textAlign || 'left'
  }
  return 'left'
})

const isLocked = computed(() => {
  return !props.activeObject.selectable
})

// 更新位置
const updatePosition = (property: 'left' | 'top', event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  props.activeObject.set({ [property]: value })

  if (props.activeObject.canvas) {
    props.activeObject.canvas.renderAll()
  }

  emit('styleChange', { [property]: value })
}

// 更新大小
const updateSize = (property: 'width' | 'height', event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  const currentValue =
    (props.activeObject[property] || 0) *
    (props.activeObject[property === 'width' ? 'scaleX' : 'scaleY'] || 1)

  if (currentValue > 0) {
    const scale = value / (props.activeObject[property] || 1)
    const scaleProperty = property === 'width' ? 'scaleX' : 'scaleY'

    props.activeObject.set({ [scaleProperty]: scale })

    if (props.activeObject.canvas) {
      props.activeObject.canvas.renderAll()
    }

    emit('styleChange', { [scaleProperty]: scale })
  }
}

// 更新旋转
const updateRotation = (event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  props.activeObject.set({ angle: value })

  if (props.activeObject.canvas) {
    props.activeObject.canvas.renderAll()
  }

  emit('styleChange', { angle: value })
}
</script>

<style scoped>
.property-panel {
  font-size: 14px;
}

.property-group {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.property-group:last-child {
  border-bottom: none;
}

h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.property-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.property-row label {
  min-width: 70px;
  font-size: 12px;
  color: #666;
}

.input-small {
  width: 60px;
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.select-input {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  background: white;
}

.color-input-group {
  display: flex;
  gap: 5px;
  flex: 1;
}

.color-input {
  width: 30px;
  height: 26px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.color-text-input {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 11px;
}

.color-preset-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  margin-top: 5px;
}

.color-preset-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.1s;
}

.color-preset-btn:hover {
  transform: scale(1.1);
}

.style-buttons,
.align-buttons,
.layer-buttons,
.transform-buttons {
  display: flex;
  gap: 4px;
}

.style-btn,
.align-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;
  transition: all 0.2s;
}

.style-btn.active,
.align-btn.active {
  background: #4285f4;
  color: white;
  border-color: #4285f4;
}

.style-btn:hover,
.align-btn:hover {
  background: #f0f0f0;
}

.style-btn.active:hover,
.align-btn.active:hover {
  background: #3367d6;
}

.btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn:hover {
  background: #f0f0f0;
}

.btn-small {
  padding: 4px 8px;
  font-size: 11px;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.btn-danger:hover {
  background: #c82333;
}

input[type='range'] {
  flex: 1;
}
</style>
