# dom-resize

dom 节点缩放插件

## 安装

```
npm install dom-resize
```

## 使用

```html
<div class="box"></div>
```

```javascript
import DomZoom from 'dom-resize'

// 初始化
const dom = new DomZoom(document.querySelector('.box'))
// or 带参数配置初始
const dom = new DomZoom('.box', {
  width: [0, 500],
  proportional: 0.5, // 宽和高按照1/2比例关联缩放
  control: [
    'bottom',
    {
      name: 'right',
      disabled: false,
      styles: {
        position: 'absolute',
        top: 0,
        right: '-5px',
        width: '10px',
        height: '100%',
        cursor: 'e-resize',
      },
    },
  ],
})

// 注册回调事件
/**
 * 开始缩放事件回调
 * @param {String} direction 缩放方向
 * @param {Element} el 缩放节点
 */
dom.on('start', (direction, el) => {
  console.log(direction, el)
})

// 缩放过程中的回调
dom.on('move', (direction, el) => {
  console.log(direction, el)
})

// 缩放结束回调
dom.on('end', (direction, el) => {
  console.log(direction, el)
})

// 注销回调事件
dom.off('end')
dom.off('move')

// 设置控制器状态及样式
dom.setControlState('bottom', true, {
  background: 'red',
})

// 设置所有控制器状态
dom.setAllControlState(false)
```

## 参数选项 options

| 属性名       | 类型           | 默认值                      | 可选值 | 说明                                                                                |
| ------------ | -------------- | --------------------------- | ------ | ----------------------------------------------------------------------------------- |
| width        | Array          | [0, Infinity]               | -      | 宽度的缩放范围，单位 px                                                             |
| height       | Array          | [0, Infinity]               | -      | 高度度的缩放范围，单位 px                                                           |
| proportional | Number/Boolean | false                       | -      | 是否按比例缩放，当为 false 时宽和高无关联，当设置为数值时，宽和高将按照设定比例缩放 |
| control      | Array          | ['right', 'bottom', 'both'] | -      | 渲染的控制器及配置                                                                  |

## 回调函数

| 回调名 | 说明         | 返回参数                          |
| ------ | ------------ | --------------------------------- |
| start  | 开始缩放回调 | direction: 缩放方向，el: 缩放节点 |
| move   | 缩放中回调   | direction: 缩放方向，el: 缩放节点 |
| end    | 结束缩放回调 | direction: 缩放方向，el: 缩放节点 |

## 实例方法

| 回调名             | 说明               | 参数                                                                                   |
| ------------------ | ------------------ | -------------------------------------------------------------------------------------- |
| setControlState    | 设置控制器状态     | controlName：控制器名称， state：状态， [controlDom](#controlDom)： 深度操控控制器 dom |
| setAllControlState | 设置所有控制器状态 | state：状态， controlDom： 深度操控控制器 dom                                          |
| destroy            | 销毁               | -                                                                                      |

### controlDom 参数

深度操控控制器 dom

- 启用模式下： controlDom 如果 dom 节点不存在，是否创建 dom 节点,如果传值为 true 使用默认样式渲染; 如果传值为 Object,使用 Object 和默认属性合并后的属性渲染
- 禁用模式下： controlDom 是否删除控制器 dom, 如果传值为 true 将删除控制器 dom; 如果传值为 false, 不会删除控制器 dom
