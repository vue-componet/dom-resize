import { getStyle, setStyles, throttle } from './utils'

export default class DomReSize {
  constructor(element, options) {
    this._initOptions(options)
    this._initElement(element)
    this._initControl()
    // this._addEventListener()
  }

  /**
   * 设置控制器状态
   * @param {String} controlName 控制器名称
   * @param {Boolean} state 控制器状态，true: 启用，false: 禁用
   * @param {Boolean | Object} controlDom 深度操控控制器dom
   *  启用模式下： controlDom 如果dom节点不存在，是否创建dom节点,如果传值为true使用默认样式渲染; 如果传值为Object,使用Object和默认属性合并后的属性渲染
   *  禁用模式下： controlDom 是否删除控制器dom, 如果传值为true将删除控制器dom; 如果传值为false, 不会删除控制器dom
   */
  setControlState(controlName, state, controlDom = true) {
    this.controlState[controlName] = state

    // 启用
    if (state) {
      if (controlDom) {
        const control_dom = this.$element.querySelector(
          `div[data-control="${controlName}"]`
        )

        const styles =
          typeof controlDom === 'boolean'
            ? DomReSize.CONTROL_STYLES_OPTIONS[controlName]
            : controlDom

        if (control_dom) {
          setStyles(control_dom, styles)
        } else {
          this._createControl(controlName, styles)
        }
      }

      return
    }

    // 禁用
    if (controlDom) {
      this._reomveControl(controlName)
    }
  }

  /**
   * 设置所有控制器的状态
   * @param {*} state 控制器状态，true: 启用，false: 禁用
   * @param {*} controlDom 深度操控控制器dom
   */
  setAllControlState(state, controlDom = true) {
    this.options.control.forEach((control) => {
      if (typeof control === 'string') {
        this.setControlState(control, state, controlDom)
        return
      } else {
        const controlName = control.name
        this.setControlState(
          controlName,
          state,
          controlDom ? control.styles : controlDom
        )
        return
      }
    })
  }

  // 用户绑定回调事件
  on(handlerName, fn) {
    this.callBackListener[handlerName] = fn
  }

  // 用户注销回调事件
  off(handlerName) {
    this.callBackListener[handlerName] = null
  }

  // 销毁
  destroy() {
    this.$element.removeEventListener('mousedown', this.handleStart)

    this._reomveControl('right')
    this._reomveControl('bottom')
    this._reomveControl('bottomRight')

    this.direction = null
    this.flag = null
    this.callBackListener = null
    this.options = null
    this.currentPoint = null
    this.transformMatrix = null
    this.proportional = 0
  }

  // 初始化节点
  _initElement(element) {
    if (typeof element === 'string') {
      this.$element = document.querySelector(element)
    } else {
      this.$element = element
    }

    let init_styles = {
      boxSizing: 'border-box',
    }
    // 如果原样式中postion未设置 默认设置上relative相对定位
    if (getStyle(this.$element, 'position') === 'static') {
      init_styles['position'] = 'relative'
    }
    setStyles(this.$element, init_styles)

    this._computedProportional()
  }

  // 初始化配置
  _initOptions(options) {
    this.options = Object.assign(
      {
        width: [0, Infinity], // ?宽度的缩放范围
        height: [0, Infinity], // ?
        proportional: false,
        control: ['left', 'right', 'bottom', 'bottomRight'],
      },
      options
    )
  }

  // 根据配置创建控制器
  _initControl() {
    this.handleStart = this._start.bind(this)
    this.handleMove = this._move()
    this.handleEnd = this._end.bind(this)
    this.callBackListener = {}
    this.controlState = {} // ?控制器状态

    this.options.control.forEach((control) => {
      if (typeof control === 'string') {
        this.setControlState(control, true, true)
        return
      } else {
        const controlName = control.name
        const state = control.disabled
        this.setControlState(controlName, !state, control.styles)
        return
      }
    })
  }

  // 绑定事件
  _addEventListener(dom) {
    dom.addEventListener('mousedown', this.handleStart)
  }

  _start(e) {
    e.stopPropagation()
    this.direction = e.target.getAttribute('data-control')

    const direction_control_state = this.controlState[this.direction]
    if (!direction_control_state) return

    this.flag = true

    this.boundRect = this.$element.getBoundingClientRect()

    const matrixStr = getStyle(this.$element, 'transform')
    if (matrixStr !== 'none') {
      const matrixExec = /\((.*)\)/.exec(matrixStr)
      this.transformMatrix = matrixExec[1].split(',')
    } else {
      this.transformMatrix = [1, 0, 0, 1, 0, 0]
    }

    document.addEventListener('mousemove', this.handleMove)
    document.addEventListener('mouseup', this.handleEnd, { once: true })

    this._setSelect(false)

    // 回调
    this.callBackListener['start']?.(this.direction, this.$element)
  }

  _move() {
    return throttle((e) => {
      e.stopPropagation()
      const direction = this.direction

      if (!this.flag) return
      if (!['left', 'right', 'top', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(direction)) return

      const dom = this.$element

      const proportional = this.options.proportional
      
      this.scrollInfo = {
        top: document.documentElement.scrollTop || document.body.scrollTop,
        left: document.documentElement.scrollLeft || document.body.scrollLeft
      }

      this.currentPoint = {
        x: e.pageX - this.scrollInfo.left,
        y: e.pageY - this.scrollInfo.top,
      }

      DomReSize.CONTROL_EVENT[direction].call(this)

      this.callBackListener['move']?.(direction, dom)
    }, 16)
  }

  _end(e) {
    e.stopPropagation()
    this.flag = false

    this._setSelect(true)
    document.removeEventListener('mousemove', this.handleMove)

    // 回调
    this.callBackListener['end']?.(this.direction, this.$element)
  }

  /**
   * 区域限制
   * @param {number | undefined} width 
   * @param {number | undefined} height 
   */
  _regionalRestrictions({width, height, controlName }) {
    const opt_width = this.options.width
    const opt_height = this.options.height
    const proportional = this.options.proportional

    let translateX = 0
    let translateY = 0

    // 等比缩放
    if (proportional) {
      if (['left', 'right', 'topRight', 'bottomRight'].includes(controlName)) {
        height = width / this.proportional
      }

      if (['top', 'bottom', 'topLeft', 'bottomLeft'].includes(controlName)) {
        width = height * this.proportional
      }
    }

    if (width < opt_width[0]) {
      width = opt_width[0]
    } else if (width > opt_width[1]) {
      width = opt_width[1]
    }

    if (height < opt_height[0]) {
      height = opt_height[0]
    } else if (height > opt_height[1]) {
      height = opt_height[1]
    }
    

    if (['topLeft', 'bottomLeft', 'left'].includes(controlName)) {
      translateX = this.boundRect.width - width
    }
    if (['topLeft', 'topRight', 'top'].includes(controlName)) {
      translateY = this.boundRect.height - height
    }

    return { width, height, translateX, translateY }
  }

  // 设置dom位置信息
  _setDomStyle(info) {
    const dom = this.$element
    let matrix = [...this.transformMatrix]
    if (info.translateX) {
      matrix[4] = +this.transformMatrix[4] + info.translateX
    }
    if (info.translateY) {
      matrix[5] = +this.transformMatrix[5] + info.translateY
    }
    dom.style.transform = `matrix(${matrix.join(',')})`

    dom.style.width = `${info.width}px`
    dom.style.height = `${info.height}px`
  }

  // 计算当前dom宽和高的比例
  _computedProportional() {
    if (this.options.proportional) {
      const rect = this.$element.getBoundingClientRect()
      const opt_width = this.options.width
      const opt_height = this.options.height

      if (rect.width < opt_width[0]) {
        rect.width = opt_width[0]
      } else if (rect.width > opt_width[1]) {
        rect.width = opt_width[1]
      }
  
      if (rect.height < opt_height[0]) {
        rect.height = opt_height[0]
      } else if (rect.height > opt_height[1]) {
        rect.height = opt_height[1]
      }
      this.proportional = (rect.width / rect.height).toFixed(4)

      if (this.proportional < 1) {
        let width_max = this.options.height[1] * this.proportional
        let width_min = this.options.height[0] * this.proportional
        this.options.width = [width_min, width_max]
      } else {
        let height_max = this.options.width[1] / this.proportional
        let height_min = this.options.width[0] / this.proportional
        this.options.height = [height_min, height_max]
      }
    }

    const padding = this._getOutside('padding')
    const border = this._getOutside('border')
    this.options.width[0] += padding[1] + padding[3] + border[1] + border[3]
    this.options.height[0] += padding[0] + padding[2] + border[0] + border[2]
   
  }

  // 获取dom外围属性值
  _getOutside(attribute) {
    const left = getStyle(this.$element, 'padding-left')
    const right = getStyle(this.$element, 'padding-right')
    const top = getStyle(this.$element, 'padding-top')
    const bottom = getStyle(this.$element, 'padding-bottom')

    let arr = ['top', 'right', 'bottom', 'left']
    let result = []

    for (let i = 0; i < arr.length; i++) {
      const style = getStyle(this.$element, `${attribute}-${arr[i]}`)
      const num = style.match(/\d+/)
      result[i] = +num[0]
    }

    return result
  }

  /**
   * 设置页面不可选中文本
   * @param {*} state 是否可以选中文本
   */
  _setSelect(state) {
    let style_dom = document.head.querySelector('#dom-resize-select-style')

    const unselect = `
      * { 
        -webkit-touch-callout: none; /*系统默认菜单被禁用*/ 
        -webkit-user-select: none; /*webkit浏览器*/ 
        -khtml-user-select: none; /*早期浏览器*/ 
        -moz-user-select: none; /*火狐*/ 
        -ms-user-select: none; /*IE10*/ 
        user-select: none; 
      }
    `
    if (style_dom) {
      style_dom.innerHTML = state ? '' : unselect
    } else {
      style_dom = document.createElement('style')
      style_dom.id = 'dom-resize-select-style'

      style_dom.innerHTML = unselect
      document.head.append(style_dom)
    }
  }

  // 删除控制器
  _reomveControl(controlName) {
    const control_dom = this.$element.querySelector(
      `div[data-control="${controlName}"]`
    )

    if (control_dom) {
      this.$element.removeChild(control_dom)
    }
  }

  // 创建控制器
  _createControl(controlName, styles) {
    const control_dom = document.createElement('div')
    control_dom.setAttribute('data-control', controlName)

    const state = this.controlState[controlName]

    // 如果控制器禁用
    if (!state) {
      styles.cursor = 'auto'
    }

    setStyles(control_dom, styles)
    this.$element.append(control_dom)

    this._addEventListener(control_dom)
  }
}


DomReSize.CONTROL_STYLES_OPTIONS = {
  left: {
    position: 'absolute',
    top: 0,
    left: '-5px',
    zIndex: 99,
    width: '10px',
    height: '100%',
    cursor: 'ew-resize',
  },
  right: {
    position: 'absolute',
    top: 0,
    right: '-5px',
    zIndex: 99,
    width: '10px',
    height: '100%',
    cursor: 'ew-resize',
  },
  top: {
    position: 'absolute',
    top: '-5px',
    left: 0,
    zIndex: 99,
    width: '100%',
    height: '10px',
    cursor: 'ns-resize',
  },
  bottom: {
    position: 'absolute',
    bottom: '-5px',
    left: 0,
    zIndex: 99,
    width: '100%',
    height: '10px',
    cursor: 'ns-resize',
  },
  topLeft: {
    position: 'absolute',
    top: '-10px',
    left: '-10px',
    zIndex: 99,
    width: '20px',
    height: '20px',
    cursor: 'nwse-resize',
  },
  bottomRight: {
    position: 'absolute',
    bottom: '-10px',
    right: '-10px',
    zIndex: 99,
    width: '20px',
    height: '20px',
    cursor: 'nwse-resize',
  },
  bottomLeft: {
    position: 'absolute',
    bottom: '-10px',
    left: '-10px',
    zIndex: 99,
    width: '20px',
    height: '20px',
    cursor: 'nesw-resize',
  },
  topRight: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    zIndex: 99,
    width: '20px',
    height: '20px',
    cursor: 'nesw-resize',
  },
}

DomReSize.CONTROL_EVENT = {
  left: function () {
    let w = this.boundRect.right - this.currentPoint.x
    let h = this.boundRect.height
    let { width, height, translateX } = this._regionalRestrictions({ width: w, height: h, controlName: 'left' })

    this._setDomStyle({
      width,
      height,
      translateX
    })
  },

  right: function () {
    let w = this.currentPoint.x - this.boundRect.left
    let h = this.boundRect.height
    let { width, height } = this._regionalRestrictions({ width: w, height: h, controlName: 'right' })

    this._setDomStyle({
      width,
      height,
    })
  },

  top: function () {
    let w = this.boundRect.width
    let h = this.boundRect.bottom - this.currentPoint.y
    let { width, height, translateY } = this._regionalRestrictions({ width: w, height: h, controlName: 'top' })
    
    this._setDomStyle({
      width,
      height,
      translateY
    })

  },

  bottom: function () {
    let w = this.boundRect.width
    let h = this.currentPoint.y - this.boundRect.top 
    let { width, height } = this._regionalRestrictions({ width: w, height: h, controlName: 'bottom' })

    this._setDomStyle({
      width,
      height,
    })
  },

  topLeft: function () {
    let w = this.boundRect.right - this.currentPoint.x
    let h = this.boundRect.bottom - this.currentPoint.y
    let { width, height, translateX, translateY } = this._regionalRestrictions({ width: w, height: h, controlName: 'topLeft' })
    
    this._setDomStyle({
      width,
      height,
      translateX,
      translateY
    })
  },

  topRight: function () {
    let w = this.currentPoint.x - this.boundRect.left
    let h = this.boundRect.bottom - this.currentPoint.y
    let { width, height, translateY } = this._regionalRestrictions({ width: w, height: h, controlName: 'topRight' })
    
    this._setDomStyle({
      width,
      height,
      translateY
    })
  },

  bottomLeft: function () {
    let w = this.boundRect.right - this.currentPoint.x
    let h = this.currentPoint.y - this.boundRect.top
    let { width, height, translateX } = this._regionalRestrictions({ width: w, height: h, controlName: 'bottomLeft' })
    
    this._setDomStyle({
      width,
      height,
      translateX
    })

  },

  bottomRight: function () {
    let w = this.currentPoint.x - this.boundRect.left
    let h = this.currentPoint.y - this.boundRect.top
    let { width, height } = this._regionalRestrictions({ width: w, height: h, controlName: 'bottomRight' })
    
    this._setDomStyle({
      width,
      height
    })
  },
}