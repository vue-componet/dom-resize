import { getStyle, setStyles } from './utils'

const CONTROL_STYLES_OPTIONS = {
  right: {
    position: 'absolute',
    top: 0,
    right: '-5px',
    zIndex: 99,
    width: '10px',
    height: '100%',
    cursor: 'e-resize'
  },
  bottom: {
    position: 'absolute',
    bottom: '-5px',
    left: 0,
    zIndex: 99,
    width: '100%',
    height: '10px',
    cursor: 'n-resize'
  },
  both: {
    position: 'absolute',
    bottom: '-10px',
    right: '-10px',
    zIndex: 99,
    width: '20px',
    height: '20px',
    cursor: 'nwse-resize'
  }
}

export default class DomReSize {
  constructor(element, options) {
    this._initOptions(options)
    this._initElement(element)
    this._initControl()
    this._addEventListener()
  }

  /**
   * 设置控制器状态
   * @param {String} controlName 控制器名称
   * @param {Boolean} state 控制器状态，true: 启用，false: 禁用
   * @param {Boolean | Object} createDom 如果dom节点不存在，是否创建dom节点, 
   *  如果传值为true使用默认样式渲染，如果传值为Object,使用Object和默认属性合并后的属性渲染
   */
  setControlState(controlName, state, createDom = true) {
    this.controlState[controlName] = state
    
    if (createDom) {
      const control_dom = this.$element.querySelector(`div[data-control="${controlName}"]`)
      const styles = typeof createDom === 'boolean' ? CONTROL_STYLES_OPTIONS[controlName] : Object.assign(CONTROL_STYLES_OPTIONS[controlName], createDom)
      
      if (control_dom) {
        setStyles(control_dom, styles)
      } else {
        this._createControl(controlName, styles)
      }

    }
  }

  // 初始化节点
  _initElement(element) {
    if (typeof element === 'string') {
      this.$element = document.querySelector(element)
    } else {
      this.$element = element
    }

    // 如果原样式中postion未设置 默认设置上relative相对定位
    if (getStyle(this.$element, 'position') === 'static') {
      setStyles(
        this.$element,
        {
          position: 'relative'
        }
      )
    }
  }

  // 初始化配置
  _initOptions(options) {
    this.options = Object.assign({
      width: [0, Infinity], // ?宽度的缩放范围
      height: [0, Infinity], // ?
      proportional: false,
      control: ['right', 'bottom', 'both']
    }, options)
  }

  // 根据配置创建控制器
  _initControl() {
    this.controlState = {} // ?控制器状态

    this.options.control.forEach((control) => {
      if (typeof control === 'string') {
        this.setControlState(control, true, false)
        this._createControl(control, CONTROL_STYLES_OPTIONS[control])
        return
      } else {
        const controlName = control.name

        const state = control.disabled

        const styles = Object.assign(CONTROL_STYLES_OPTIONS[controlName], control.styles)
        this.setControlState(controlName, !state, false)
        this._createControl(controlName, styles)
        return
      }
      
    })
  }

  // 绑定事件
  _addEventListener() {
    this.handleMove = this._move.bind(this)
    this.handleEnd = this._end.bind(this)

    this.$element.addEventListener('mousedown', (e) => {
      this.direction = e.target.getAttribute('data-control')

      const direction_control_state = this.controlState[this.direction]
      if (!direction_control_state) return

      this.flag = true
      this.startPoint = {
        x: e.screenX,
        y: e.screenY
      }
      
      document.addEventListener('mousemove', this.handleMove)
      document.addEventListener('mouseup', this.handleEnd, { once: true })
      
      this._setSelect(false)
    })

  }

  _move(e) {
    const direction = this.direction

    if (!this.flag) return
    if (!['right', 'bottom', 'both'].includes(direction)) return
    

    const dom = this.$element
    let startPoint = this.startPoint

    const proportional = this.options.proportional
    const opt_width = this.options.width
    const opt_height = this.options.height

    let w = e.screenX - startPoint.x
    let h = e.screenY - startPoint.y

    this.startPoint = {
      x: e.screenX,
      y: e.screenY
    }

    let width = dom.clientWidth + w
    let height = dom.clientHeight + h
    
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

    if (direction === 'right') {

      dom.style.width = width + 'px'
      // 等比缩放
      if (proportional) {
        height = width / proportional
        dom.style.height = height + 'px'
      }
      return
    }
    
    if (direction === 'bottom') {
      dom.style.height = height + 'px'
      // 等比缩放
      if (proportional) {
        width = height * proportional
        dom.style.width = width + 'px'
      }
      return
    }

    if (direction === 'both') {
      // 等比缩放
      if (proportional) {
        if (width >= height) {
          width = height * proportional
        } else {
          height = width / proportional
        }
      }

      dom.style.width = `${width}px`
      dom.style.height = `${width}px`
      return
    }
  }

  _end() {
    this.flag = false

    this._setSelect(true)
    document.removeEventListener('mousemove', this.handleMove)
  }

  // 用户绑定回调事件
  // on(handlerName, fn) {
  //   this.callBackListener[handlerName] = fn
  // }

  /**
   * 设置页面不可选中文本
   * @param {*} state 是否可以选中文本
   */
  _setSelect(state) {
    let style_dom = document.head.querySelector('#dom-resize-select-style')

    console.log(style_dom)
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
  }
}

