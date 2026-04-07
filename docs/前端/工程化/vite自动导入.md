# Vite 自动导入配置实践

在 Vue3 + Vite 项目里,手写一堆 `import` 很快就会变得很烦:

```ts
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { ElMessage } from 'element-plus'
```

如果项目里还有一堆 `composables`、`stores`、`components`,文件头部很容易越来越长。

这时候就可以用自动导入插件来处理。

前端里最常见的就是这组配置:

```ts
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
```

这篇文章就专门讲清楚它们怎么配,以及各自负责什么。

## 1. 先说结论: 这两个插件不是一回事

很多人第一次接触自动导入时,容易把这两个插件混在一起。

实际上职责很明确:

- `unplugin-auto-import` 负责自动导入**函数、API、hooks、composables**
- `unplugin-vue-components` 负责自动导入**Vue 组件**

你可以这么理解:

- `ref`、`computed`、`watch`、`useRoute` 这种,交给 `AutoImport`
- `ElButton`、`ElTable`、`BaseDialog` 这种,交给 `Components`

一句话:

**函数用 `AutoImport`,组件用 `Components`。**

---

## 2. 安装依赖

如果你是 Vue3 + Vite + Element Plus 项目,一般会装这几项:

```bash
pnpm add element-plus
pnpm add -D unplugin-auto-import unplugin-vue-components
```

如果项目还没装 Vue 插件,补上:

```bash
pnpm add -D @vitejs/plugin-vue
```

---

## 3. 一份常用的完整配置

先直接上最常用的一版 `vite.config.ts`:

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
      dirsScanOptions: {
        types: true,
      },
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
      directoryAsNamespace: false,
    }),
  ],
})
```

这份配置已经覆盖了大部分业务项目的自动导入需求。

---

## 4. 这份配置分别做了什么

### `AutoImport` 配置说明

```ts
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
})
```

重点看这几个字段。

#### `imports`

这里定义要自动导入哪些库的 API:

```ts
imports: ['vue', 'vue-router', '@vueuse/core']
```

配完之后,你在业务代码里就可以直接写:

```ts
const count = ref(0)
const route = useRoute()
const router = useRouter()
const debounced = useDebounceFn(() => {}, 300)
```

不需要再手写:

```ts
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
```

#### `dirs`

这个配置用来扫描你自己的目录:

```ts
dirs: ['src/composables/**', 'src/stores']
```

比如你有这些文件:

```txt
src/composables/useUserInfo.ts
src/composables/useTable.ts
src/stores/user.ts
```

那你在业务里就可以直接用:

```ts
const { userInfo } = useUserInfo()
const table = useTable()
const userStore = useUserStore()
```

这类目录自动扫描,很适合:

- `composables`
- `hooks`
- `stores`
- `utils` 里固定导出的工具函数

但也别扫得太宽,不然容易引入命名冲突。

#### `resolvers`

```ts
resolvers: [ElementPlusResolver()]
```

这一步常用于配合第三方 UI 库。

在 Element Plus 场景里,通常会拿它去处理按需导入相关能力,这样你不需要手动一个个写 UI 库的导入代码。

#### `dts`

```ts
dts: 'src/auto-imports.d.ts'
```

这个会生成类型声明文件,让 TypeScript 和 IDE 知道这些自动导入的变量是存在的。

如果不开这个,你大概率会遇到:

- 编辑器提示未定义
- TS 类型识别异常

#### `eslintrc`

```ts
eslintrc: {
  enabled: true,
  filepath: './.eslintrc-auto-import.json',
  globalsPropValue: true,
}
```

这个配置用来给 ESLint 生成一份自动导入全局声明,避免出现:

```txt
'ref' is not defined
'useRoute' is not defined
```

#### `vueTemplate`

```ts
vueTemplate: true
```

开启后,模板里也能更自然地使用自动导入能力。  
这在一些组合式 API 或工具函数需要在模板表达式里使用时会更顺手。

---

## 5. `Components` 配置说明

```ts
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
})
```

这个插件主要负责组件层面的自动注册。

### `dirs`

```ts
dirs: ['src/components']
```

它会扫描这个目录下的本地组件。

比如:

```txt
src/components/BaseTable.vue
src/components/BaseDialog.vue
```

业务里就可以直接写:

```vue
<template>
  <BaseTable />
  <BaseDialog />
</template>
```

而不需要再手写:

```ts
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
```

### `deep`

```ts
deep: true
```

表示递归扫描子目录。

比如下面这种结构也能识别:

```txt
src/components/form/SearchPanel.vue
src/components/layout/AppHeader.vue
```

### `dts`

```ts
dts: 'src/components.d.ts'
```

这和 `AutoImport` 的 `dts` 作用类似,都是为了让 TS 和 IDE 正确认出这些全局组件。

### `resolvers`

```ts
resolvers: [
  ElementPlusResolver({
    importStyle: 'css',
  }),
]
```

这是 Vue 项目里最常见的配置之一。

配完之后,你在模板里写:

```vue
<template>
  <ElButton type="primary">提交</ElButton>
  <ElTable :data="list" />
</template>
```

通常就不需要再自己手动导入 `ElButton`、`ElTable` 了。

`importStyle: 'css'` 表示按需引入对应样式,这是 Element Plus 场景里很常见的配置方式。

### `directoryAsNamespace`

如果你的组件目录层级比较深,而且不同目录下经常有同名组件,可以考虑:

```ts
Components({
  dirs: ['src/components'],
  directoryAsNamespace: true,
})
```

这个配置的作用是把目录名也纳入组件命名空间,减少重名冲突。

适合这种场景:

- `src/components/table/index.vue`
- `src/components/form/index.vue`

如果不开命名空间,这类结构比较容易重名。

---

## 6. 配完之后,业务代码会清爽很多

比如以前你可能要这样写:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import BaseTable from '@/components/BaseTable.vue'

const count = ref(0)
const route = useRoute()
const total = computed(() => count.value * 2)
const onSearch = useDebounceFn(() => {
  console.log(route.query)
}, 300)
</script>

<template>
  <ElButton type="primary" @click="onSearch">查询</ElButton>
  <BaseTable />
  <div>{{ total }}</div>
</template>
```

配置自动导入后,可以简化成:

```vue
<script setup lang="ts">
const count = ref(0)
const route = useRoute()
const total = computed(() => count.value * 2)
const onSearch = useDebounceFn(() => {
  console.log(route.query)
}, 300)
</script>

<template>
  <ElButton type="primary" @click="onSearch">查询</ElButton>
  <BaseTable />
  <div>{{ total }}</div>
</template>
```

文件顶部会干净很多,尤其在后台管理项目里效果很明显。

---

## 7. TypeScript 里别忘了声明文件

自动导入不是“魔法”,本质上还是插件在构建阶段帮你补 import。

所以生成出来的这两个文件很关键:

- `src/auto-imports.d.ts`
- `src/components.d.ts`

如果你的 `tsconfig.json` 没把它们纳入类型检查范围,IDE 可能还是会报红。

可以这样写:

```json
{
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "src/auto-imports.d.ts",
    "src/components.d.ts"
  ]
}
```

很多项目里 `src/**/*.d.ts` 已经能覆盖到,但你最好确认一下,避免“明明配了还是报错”。

---

## 8. 常见坑

### 1. `AutoImport` 不能替代 `Components`

很多人会误以为配了 `AutoImport` 就能直接在模板里用 `<ElButton />`。  
这是不对的。

- `AutoImport` 解决的是函数和 API
- `Components` 解决的是组件标签

这两个插件通常是搭配使用,不是互相替代。

### 2. 本地组件能自动导入,不代表业务函数也能自动导入

如果你只配了:

```ts
Components({
  dirs: ['src/components'],
})
```

那它只会扫描组件目录,不会顺便把 `src/composables` 里的函数也自动导进来。

业务函数要交给 `AutoImport` 的 `dirs`。

### 3. `dirs` 配太大容易冲突

比如你把整个 `src` 都拿去扫:

```ts
dirs: ['src/**']
```

短期看起来省事,长期很容易出问题:

- 命名冲突
- 不知道某个函数到底从哪来
- 团队阅读成本上升

比较稳妥的做法是只扫描明确目录:

- `src/composables`
- `src/stores`
- `src/directives`

### 4. 编辑器报红,通常先看 `dts`

如果项目能跑,但 VS Code 一直报:

- `ref is not defined`
- `ElButton is not defined`

优先检查:

1. `dts` 是否开启
2. 声明文件是否生成出来
3. `tsconfig.json` 是否包含这些 `.d.ts`

### 5. Element Plus 样式没生效

如果组件能用,但样式不对,优先检查 `ElementPlusResolver` 的配置和项目实际样式策略是否一致。

常见做法就是:

```ts
ElementPlusResolver({
  importStyle: 'css',
})
```

---

## 9. 更适合哪些项目

自动导入非常适合:

- Vue3 组合式 API 项目
- 中后台项目
- 组件和 hooks 比较多的项目
- Element Plus、Naive UI 这类 UI 库项目

如果你的项目非常小,页面也不多,手写 import 其实也完全没问题。  
自动导入的核心价值不是“炫技”,而是**降低样板代码,统一团队书写习惯**。

---

## 10. 总结

Vite 里的自动导入,最常用就是这套组合:

```ts
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
```

记住分工就不容易乱:

- `AutoImport` 负责 `ref`、`computed`、`useRoute`、`useUserStore` 这类函数和 API
- `Components` 负责 `ElButton`、`ElTable`、`BaseTable` 这类组件
- `ElementPlusResolver` 负责把 Element Plus 的按需导入接起来

如果你是 Vue3 + Vite + Element Plus 项目,照着本文这份 `vite.config.ts` 去配,基本就够用了。
