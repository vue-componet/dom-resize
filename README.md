# turntable-gesture

转盘手势插件

## 安装
```
npm install turntable-gesture
```

## 使用
``` html
<div class="box"></div>
```

``` javascript
import TurntableGesture from 'turntable-gesture'

// 初始化
const gesture = new TurntableGesture(document.querySelector('.box'))
// or 带参数配置初始
const gesture = new TurntableGesture('.box', {
  initialAngle: 45,
  direction: 'all'
})

// 注册回调事件
// 结束转动回调，angle：转动的角度
gesture.on('end', (angle) => {
  console.log(angle)
})

// 转动过程中的回调，angle：转动的角度
gesture.on('move', (angle) => {
  console.log(angle)
})


// 注销回调事件
gesture.off('end')
gesture.off('move')
```

## 参数选项 options

| 属性名 | 类型 | 默认值 | 可选值| 说明 |
|--------|-----|--------|-------|-----|
| direction | string | all | all/clockwise/anti-clockwise| 允许转动方向 |
| initialAngle | number | 0 | - | 初始已旋转角度 |
| sensitivity | number | 1 | - | 转动灵敏度，数值越小越灵敏 |

## 回调函数

| 回调名 | 说明 | 返回参数 |
|----|----|--------|
| end | 转动结束回调 | angle,旋转的角度 |
| move | 转动过程回调 | angle,旋转的角度 |

## 实例方法
| 回调名 | 说明 | 返回参数 |
|----|----|--------|
| destroy | 销毁 | - |