# Vite 自动导入配置

在 Vue3 + Vite 项目里，每个文件都写一堆 `import` 很烦：

```ts
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { ElMessage } from 'element-plus'
```

用自动导入插件可以省掉这些。

## 两个插件的分工

```ts
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
```

记住一句话：**函数用 `AutoImport`，组件用 `Components`**

- `ref`、`computed`、`watch`、`useRoute` → `AutoImport`
- `ElButton`、`ElTable`、`BaseTable` → `Components`

## 安装

```bash
pnpm add element-plus
pnpm add -D unplugin-auto-import unplugin-vue-components
```

## 完整配置

直接复制到 `vite.config.ts` 就能用：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core'],
      dirs: ['src/composables/**', 'src/stores'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: true,
      },
      vueTemplate: true,
    }),
    Components({
      dirs: ['src/components'],
      extensions: ['vue'],
      deep: true,
      dts: 'src/components.d.ts',
      resolvers: [
        ElementPlusResolver({
          importStyle: 'css',
        }),
      ],
    }),
  ],
})
```

## 关键配置说明

### AutoImport

| 配置 | 作用 |
|------|------|
| `imports` | 哪些库的 API 要自动导入，比如 `vue`、`vue-router` |
| `dirs` | 扫描你自己的目录，比如 `composables`、`stores` |
| `resolvers` | 配合 Element Plus 按需导入 |
| `dts` | 生成类型声明，让 TS 和编辑器认识这些变量 |
| `eslintrc` | 给 ESLint 生成全局声明，避免报 `not defined` |
| `vueTemplate` | 模板里也能用自动导入的函数 |

配完后直接写 `const count = ref(0)` 就行，不用 import。

### Components

| 配置 | 作用 |
|------|------|
| `dirs` | 扫描本地组件目录 |
| `deep` | 递归扫描子目录 |
| `dts` | 生成组件类型声明 |
| `resolvers` | Element Plus 组件按需导入 |

配完后模板里直接写 `<ElButton />`、`<BaseTable />`，不用 import。

## 别忘了 tsconfig

自动生成的声明文件要被 tsconfig 识别：

```json
{
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts",
    "src/**/*.vue"
  ]
}
```

一般 `src/**/*.d.ts` 已经能覆盖，确认一下就行。

## 常见坑

**1. AutoImport 和 Components 不能互相替代**

配了 `AutoImport` 不代表能在模板里用 `<ElButton />`，组件必须配 `Components`。

**2. dirs 别扫太宽**

```ts
// 别这样
dirs: ['src/**']

// 只扫明确的目录
dirs: ['src/composables', 'src/stores']
```

扫太宽容易命名冲突，也不知道函数从哪来的。

**3. 编辑器报红先看 dts**

项目能跑但 VS Code 报 `ref is not defined`，检查：
1. `dts` 有没有开
2. 声明文件有没有生成
3. `tsconfig.json` 有没有包含 `.d.ts`

**4. Element Plus 样式没生效**

组件能用但样式不对，检查 `ElementPlusResolver` 的 `importStyle` 配置。

## 效果对比

之前：

```vue
<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import BaseTable from '@/components/BaseTable.vue'

const count = ref(0)
const route = useRoute()
</script>
```

之后：

```vue
<script setup>
const count = ref(0)
const route = useRoute()
</script>
```

清爽多了，尤其是中后台项目，效果很明显。
