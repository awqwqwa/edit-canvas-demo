import { ref, reactive, shallowRef, markRaw } from 'vue'
import { Canvas } from 'fabric'
import type {
  EditorCanvas,
  EditorConfig,
  EditorObject,
  EditorTextObject,
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

    // 设置画布全局样式
    fabricCanvas.set({
      // 设置选择区域样式
      selectionColor: 'rgba(100, 100, 255, 0.1)',
      selectionBorderColor: 'red',
      selectionLineWidth: 2,
    })

    // 设置全局默认值 - 隐藏连接线
    try {
      const fabricWindow = window as unknown as { fabric?: { Object?: { prototype?: { withConnection?: boolean } } } };
      if (fabricWindow.fabric?.Object?.prototype) {
        fabricWindow.fabric.Object.prototype.withConnection = false;
        console.log('🔗 全局设置：隐藏所有对象的连接线');
      }
    } catch (error) {
      console.warn('⚠️ 无法设置全局连接线隐藏:', error);
    }

    // 设置画布默认对象样式
    Canvas.prototype.getActiveObject = function() {
      const activeObject = this._activeObject;
      if (activeObject) {
        activeObject.set({
          transparentCorners: false, // 边框方点: false 实心  true 空心
          borderColor: 'red', // 边框颜色
          cornerStrokeColor: 'red',
          cornerColor: 'red', // 边框方点的颜色
          cornerStyle: 'rect',
          cornerSize: 4, // 边框方点的大小
          padding: 0,
          borderScaleFactor: 2,
          // 隐藏旋转控制器和边框之间的连接线
          withConnection: false,
        });
      }
      return activeObject;
    };

    // 自定义旋转控制器图标渲染函数
    const renderRotateIcon = (ctx: CanvasRenderingContext2D, left: number, top: number) => {
      const size = 24; // 图标大小
      const radius = size / 2;
      
      // 保存当前画布状态
      ctx.save();
      
      // 移动到图标中心位置
      ctx.translate(left, top);
      
      // 绘制圆形背景
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#4285f4'; // 蓝色背景
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制旋转箭头图标
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      
      // 绘制弧形箭头 (3/4 圆弧)
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.45, -Math.PI * 0.75, Math.PI * 0.75, false);
      ctx.stroke();
      
      // 绘制箭头头部
      const arrowSize = 5;
      const arrowAngle = Math.PI * 0.75;
      const arrowX = Math.cos(arrowAngle) * radius * 0.45;
      const arrowY = Math.sin(arrowAngle) * radius * 0.45;
      
      // 箭头的两条线
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - arrowSize * 0.7, arrowY - arrowSize * 0.7);
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX + arrowSize * 0.7, arrowY - arrowSize * 0.7);
      ctx.stroke();
      
      // 恢复画布状态
      ctx.restore();
    };

    // 延迟设置自定义旋转控制器，确保 Fabric.js 完全加载
    setTimeout(() => {
      try {
        // 检查 Fabric.js 是否可用 - 使用更详细的检查
        const fabricGlobal = (window as { fabric?: unknown }).fabric;
        console.log('🔍 Fabric.js 全局对象:', fabricGlobal);
        
        if (fabricGlobal) {
          // 检查不同可能的结构
          const fabricObj = fabricGlobal as { 
            Object?: { 
              prototype?: { 
                controls?: unknown 
              } 
            },
            controlsUtils?: unknown,
            controls?: unknown
          };
          
          console.log('🔍 检查结构:');
          console.log('- fabric.Object:', !!fabricObj.Object);
          console.log('- fabric.Object.prototype:', !!fabricObj.Object?.prototype);
          console.log('- fabric.Object.prototype.controls:', !!fabricObj.Object?.prototype?.controls);
          console.log('- fabric.controls:', !!fabricObj.controls);
          console.log('- fabric.controlsUtils:', !!fabricObj.controlsUtils);
          
          // 尝试访问控制器
          const controls = fabricObj.Object?.prototype?.controls as { mtr?: unknown } | undefined;
          if (controls) {
            console.log('🔍 找到控制器对象:', Object.keys(controls));
            console.log('- mtr 控制器:', !!controls.mtr);
            
            if (controls.mtr) {
              const mtrControl = controls.mtr as { render?: unknown };
              console.log('- mtr.render:', !!mtrControl.render);
              
              if (mtrControl.render) {
                mtrControl.render = function(ctx: CanvasRenderingContext2D, left: number, top: number) {
                  console.log('🎨 渲染自定义旋转控制器');
                  renderRotateIcon(ctx, left, top);
                };
                console.log('✅ 自定义旋转控制器已设置');
              } else {
                console.warn('❌ mtr 控制器没有 render 方法');
              }
            } else {
              console.warn('❌ 无法找到 mtr 控制器');
            }
          } else {
            console.warn('❌ 无法找到 controls 对象');
          }
        } else {
          console.warn('❌ 无法找到 Fabric.js 全局对象');
        }
      } catch (error) {
        console.error('❌ 设置自定义旋转控制器失败:', error);
      }
    }, 100);
    
    // 设置旋转控制器的基本样式
    fabricCanvas.on('object:added', (e) => {
      if (e.target) {
        e.target.set({
          hasRotatingPoint: true, // 显示旋转控制器
          withConnection: false, // 隐藏连接线
          rotatingPointOffset: 35, // 旋转控制器距离对象的距离
        });
        console.log('📦 对象已添加，隐藏连接线并设置旋转控制器偏移:', e.target.type);
      }
    });

    // 添加选择事件监听，用于调试
    fabricCanvas.on('selection:created', (e) => {
      console.log('🎯 对象已选中:', e.selected?.[0]?.type);
    });

    // 测试控制器是否存在
    console.log('🔍 Fabric.js 版本和控制器检查:');
    console.log('- fabric 对象:', !!(window as { fabric?: unknown }).fabric);
    console.log('- Object 原型:', !!((window as { fabric?: { Object?: unknown } }).fabric as { Object?: unknown })?.Object);
    
    // 尝试通过导入的模块直接设置控制器
    const setupControlsDirectly = () => {
      try {
        console.log('🛠️ 尝试直接设置控制器...');
        
        // 方法1: 通过导入的 Canvas 类
        const canvasPrototype = Canvas.prototype as { 
          _setupCurrentTransform?: unknown,
          _drawControl?: unknown 
        };
        console.log('- Canvas.prototype:', !!canvasPrototype);
        
        // 方法2: 检查已创建的画布实例
        if (fabricCanvas) {
          console.log('- 画布实例存在');
          const canvasControls = (fabricCanvas as { controls?: unknown }).controls;
          console.log('- 画布控制器:', !!canvasControls);
        }
        
        // 方法3: 尝试在对象被选中时动态设置
        fabricCanvas.on('selection:created', (e) => {
          const obj = e.selected?.[0];
          if (obj) {
            console.log('🎯 对象选中，尝试设置控制器:', obj.type);
            const objControls = (obj as { controls?: { mtr?: { render?: unknown } } }).controls;
            if (objControls?.mtr) {
              console.log('- 找到对象的 mtr 控制器');
              objControls.mtr.render = function(ctx: CanvasRenderingContext2D, left: number, top: number) {
                console.log('🎨 渲染对象级自定义旋转控制器');
                renderRotateIcon(ctx, left, top);
              };
              console.log('✅ 对象级控制器设置成功');
            }
          }
        });
        
      } catch (error) {
        console.error('❌ 直接设置控制器失败:', error);
      }
    };

    // 立即尝试直接设置
    setupControlsDirectly();
    
    // 延迟再次尝试
    setTimeout(setupControlsDirectly, 500);
    setTimeout(setupControlsDirectly, 1000);
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

    // 为新对象设置样式，隐藏连接线
    fabricObject.set({
      // 保留旋转控制器但隐藏连接线
      hasRotatingPoint: true,
      rotatingPointOffset: 35, // 设置旋转控制器距离
      borderColor: 'red',
      cornerColor: 'red',
      cornerStrokeColor: 'red',
      borderScaleFactor: 2,
      cornerSize: 4,
      transparentCorners: false,
      padding: 0,
    })

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
    // 包含自定义属性
    return JSON.stringify(canvas.value.toObject(['id', 'elementType', 'isEditable']))
  }

  // 重新设置文本对象的事件处理器
  const setupTextObjectEvents = (textObject: EditorTextObject) => {
    // 双击进入编辑模式
    textObject.on('mousedblclick', () => {
      // 这里可以触发进入编辑模式的逻辑
      state.isTextEditing = true
    })

    // 选择时触发事件
    textObject.on('selected', () => {
      state.activeObject = textObject
      state.selectedElementId = textObject.id
    })
  }

  // 从JSON加载画布
  const loadCanvasFromJSON = (jsonData: string) => {
    if (!canvas.value) return

    // 保存当前的活动对象ID（如果有）
    const previousActiveObjectId = state.activeObject?.id

    canvas.value
      .loadFromJSON(jsonData)
      .then(() => {
        canvas.value!.renderAll()

        // 重新绑定事件
        setupCanvasEvents(canvas.value! as EditorCanvas)

        // 重新设置所有对象的事件处理器
        const objects = canvas.value!.getObjects() as EditorObject[]
        objects.forEach((obj) => {
          const editorObj = obj as EditorObject
          if (editorObj.elementType === 'text') {
            // 重新设置文本对象的事件处理器
            setupTextObjectEvents(editorObj as EditorTextObject)
          }
          // 可以在这里添加其他类型对象的事件设置
        })

        // 恢复活动对象（如果之前有的话）
        if (previousActiveObjectId) {
          const targetObject = objects.find(
            (obj) => (obj as EditorObject).id === previousActiveObjectId,
          )
          if (targetObject) {
            canvas.value!.setActiveObject(targetObject)
            state.activeObject = targetObject as EditorObject
            state.selectedElementId = (targetObject as EditorObject).id
          } else {
            // 如果找不到之前的活动对象，清空状态
            state.activeObject = null
            state.selectedElementId = null
          }
        } else {
          // 清空活动对象状态
          state.activeObject = null
          state.selectedElementId = null
        }

        // 确保画布重新渲染
        canvas.value!.renderAll()
      })
      .catch((error) => {
        console.error('加载画布状态失败:', error)
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
