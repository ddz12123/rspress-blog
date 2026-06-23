# postcss配置

## 1、安装依赖

```bash
pnpm install postcss postcss-pxtorem autoprefixer -D
```

## 2、postcss.config.js

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

## 3、rem.ts

### 方式一：原生 JS

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

### 方式二：Vue 组合式 API

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

## 4、main.ts配置

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

