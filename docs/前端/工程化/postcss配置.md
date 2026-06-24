# PostCSS 配置

PostCSS 实现移动端/PC 端自适应的两种方案：`postcss-pxtorem`（rem）和 `postcss-px-to-viewport`（vw）。

---

## 一、postcss-pxtorem（rem 方案）

### 1. 安装依赖

```bash
pnpm install postcss postcss-pxtorem autoprefixer -D
```

### 2. postcss.config.js

```js
export default {
  plugins: {
    autoprefixer: {},
    'postcss-pxtorem': {
      rootValue: 16,
      propList: ['*', '!font-size'],
      selectorBlackList: ['.no-rem'],
      unitPrecision: 1,
      replace: true,
      mediaQuery: false,
      minPixelValue: 1,
      exclude: /node_modules/i,
    },
  },
}
```

### 3. 动态设置根字体大小

#### 方式一：原生 JS

```ts
function setRem() {
  const baseWidth = 1920
  const baseFontSize = 16
  const currentWidth = document.documentElement.clientWidth || window.innerWidth
  const scale = currentWidth / baseWidth
  const fontSize = Math.max(10, baseFontSize * scale)
  document.documentElement.style.fontSize = `${fontSize}px`
}

setRem()

window.onresize = function () {
  setRem()
}
```

#### 方式二：Vue 组合式 API

```ts
import { watch } from 'vue';
import { useWindowSize } from '@vueuse/core';

const DESIGN_WIDTH = 1920;
const BASE_FONT_SIZE = 16;
const MIN_FONT_SIZE = 12;

const updateRootFontSize = (viewportWidth: number): void => {
  const nextFontSize = Math.max((viewportWidth / DESIGN_WIDTH) * BASE_FONT_SIZE, MIN_FONT_SIZE);
  document.documentElement.style.fontSize = `${nextFontSize}px`;
};

export const useRootFontSize = (): void => {
  const { width } = useWindowSize();

  watch(width, updateRootFontSize, { immediate: true });
};
```

在 `App.vue` 中使用：

```vue
<script setup lang="ts">
import { useRootFontSize } from '@/utils/rem';

useRootFontSize();
</script>
```

### 4. main.ts 配置

```ts
import { createApp } from 'vue'
import pinia from './stores'
import Antd from 'ant-design-vue'
import './styles/main.css'
import './utils/rem'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(Antd)

app.mount('#app')
```

---

## 二、postcss-px-to-viewport（vw 方案）

> 使用 vw 视口单位实现适配，无需动态设置根字体大小，比 rem 方案更简洁。

### 1. 安装依赖

```bash
pnpm install postcss-px-to-viewport-8-plugin -D
```

> `postcss-px-to-viewport-8-plugin` 是适配 PostCSS 8 的版本，原版 `postcss-px-to-viewport` 已停止维护。

### 2. postcss.config.js

```js
import pxtoviewport from 'postcss-px-to-viewport-8-plugin';

export default {
  plugins: {
    autoprefixer: {},
    'postcss-px-to-viewport-8-plugin': {
      unitToConvert: 'px',
      viewportWidth: 1920,
      unitPrecision: 5,
      propList: ['*'],
      viewportUnit: 'vw',
      fontViewportUnit: 'vw',
      selectorBlackList: [],
      minPixelValue: 2,
      mediaQuery: false,
      replace: true,
      exclude: /node_modules/i,
      landscape: false,
    },
  },
}
```

### 3. 完整参数说明

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `unitToConvert` | `string` | `'px'` | 需要转换的单位，一般保持默认 `px` |
| `viewportWidth` | `number` | `320` | 设计稿的视口宽度，必须与设计稿一致，如 1920、750、375 |
| `unitPrecision` | `number` | `5` | 转换后 vw 值的小数位数，避免过长的小数 |
| `propList` | `string[]` | `['*']` | 可转换的属性列表，`['*']` 表示所有属性；支持 `!` 排除，如 `['*', '!font*']` |
| `viewportUnit` | `string` | `'vw'` | 转换后的视口单位，通常使用 `vw` |
| `fontViewportUnit` | `string` | `'vw'` | 字体使用的视口单位，可与 `viewportUnit` 不同 |
| `selectorBlackList` | `string[]` | `[]` | 选择器黑名单，匹配的选择器不会被转换；字符串匹配包含关系，正则精确匹配 |
| `minPixelValue` | `number` | `1` | 小于该值的 px 不会转换，建议设为 `2` 保留 1px 边框 |
| `mediaQuery` | `boolean` | `false` | 是否转换媒体查询中的 px，PC 端通常设为 `false` |
| `replace` | `boolean` | `true` | 是否直接替换原始规则，`false` 则保留原始 px 作为 fallback |
| `exclude` | `RegExp/RegExp[]` | `undefined` | 排除的文件或目录，通常排除 `node_modules` |
| `include` | `RegExp/RegExp[]` | `undefined` | 仅转换匹配的文件，与 `exclude` 可同时使用，取交集 |
| `landscape` | `boolean` | `false` | 是否添加横屏媒体查询 `@media (orientation: landscape)` |
| `landscapeUnit` | `string` | `'vw'` | 横屏时使用的单位 |
| `landscapeWidth` | `number` | `568` | 横屏时的视口宽度 |

### 4. propList 详解

`propList` 支持通配符和排除语法：

```js
propList: ['*']                    // 所有属性都转换
propList: ['*', '!font-size']      // 所有属性转换，但排除 font-size
propList: ['*', '!font*']          // 排除所有 font 开头的属性
propList: ['*position*']           // 只转换包含 position 的属性（如 background-position-y）
propList: ['width', 'height']      // 只转换 width 和 height
```

### 5. 行内忽略注释

可以用特殊注释跳过单行转换：

```css
.class {
  /* px-to-viewport-ignore-next */
  width: 10px;
  padding: 10px;
  height: 10px; /* px-to-viewport-ignore */
  border: solid 2px #000; /* px-to-viewport-ignore */
}

/* 输出 */
.class {
  width: 10px;
  padding: 3.125vw;
  height: 10px;
  border: solid 2px #000;
}
```

### 6. Vite 配置示例

```ts
// electron.vite.config.ts 或 vite.config.ts
import pxtoviewport from 'postcss-px-to-viewport-8-plugin';

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        pxtoviewport({
          unitToConvert: 'px',
          viewportWidth: 1920,
          unitPrecision: 5,
          propList: ['*'],
          viewportUnit: 'vw',
          fontViewportUnit: 'vw',
          selectorBlackList: [],
          minPixelValue: 2,
          mediaQuery: false,
          replace: true,
          exclude: /node_modules/i,
          landscape: false,
        }),
      ],
    },
  },
});
```

### 7. 注意事项

1. **设计稿宽度**：`viewportWidth` 必须与设计稿一致，否则换算比例错误
2. **选择器排除**：使用 `selectorBlackList` 排除不需要转换的类名，如第三方组件库
3. **1px 问题**：设置 `minPixelValue: 2` 可保留 1px 边框不被转换
4. **第三方库**：建议 `exclude: /node_modules/i` 排除第三方库，避免样式异常
5. **横屏适配**：如需横屏支持，开启 `landscape: true` 并设置 `landscapeWidth`
6. **字体缩放**：`fontViewportUnit` 可单独控制字体单位，设为 `'rem'` 可避免字体随视口过度缩放

---

## 三、方案对比

| 特性 | postcss-pxtorem (rem) | postcss-px-to-viewport (vw) |
| --- | --- | --- |
| 原理 | 根字体大小动态计算 | 视口百分比 |
| 额外代码 | 需要 `useRootFontSize` | 无需额外代码 |
| 1px 处理 | 需要 `minPixelValue` 过滤 | 同样支持 |
| 兼容性 | IE9+ | IE9+（部分属性不支持） |
| 推荐场景 | 需要精确控制最大/最小字体 | 简单适配，无额外逻辑 |
