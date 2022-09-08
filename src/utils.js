// 设置节点样式
export function setStyles(dom, styles) {
  for (let style in styles) {
    dom.style[style] = styles[style]
  }
}

// 获取节点class中的属性
export function getStyle(obj, attr) {
  return obj.currentStyle
    ? obj.currentStyle[attr]
    : getComputedStyle(obj, false)[attr]
}

// 节流
export function throttle(fn, wait) {
  var previous = 0
  return function () {
    var now = Date.now()
    var context = this
    var args = arguments
    if (now - previous > wait) {
      fn.apply(context, args)
      previous = now
    }
  }
}