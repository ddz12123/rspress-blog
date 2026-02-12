# TanStack Query指南

## 前言：为什么你需要 TanStack Query？

如果你是一个前端开发者，你一定写过这样的代码：

**Vue3 版本**  
```vue
<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const data = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const res = await axios.get('/api/posts')
    data.value = res.data
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
})
</script>
```

**React 版本**  
```jsx
import { useState, useEffect } from 'react'
import axios from 'axios'

function Posts() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get('/api/posts')
      .then(res => setData(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [])
}
```

这段代码看起来人畜无害，但当你的项目膨胀到几十个页面时，你会发现：

- **重复请求**：两个组件需要同样的数据，各自发一次请求，浪费带宽。
- **缓存缺失**：用户切换页面再回来，数据重新加载，明明没有变化。
- **状态管理混乱**：每个组件都要定义 loading/error/data，模板/JSX 里一堆条件渲染。
- **竞态条件**：快速切换参数时，先发的请求后返回，页面显示错误数据。
- **后台刷新**：用户把页面挂了一夜，数据还是旧的，没有任何自动更新机制。

**TanStack Query**（原 React Query，现支持 Vue、Solid、Svelte）就是为了解决这一系列问题而生的。它不是要替代 axios，而是站在 HTTP 客户端的肩膀上，帮你把**数据获取**和**数据状态管理**彻底分离。你只需要告诉它：“我需要这些数据”，剩下的缓存、重试、依赖刷新、乐观更新……它全包了。

本文将从零开始，分别讲解 TanStack Query 在 **Vue3** 和 **React** 中的使用。你会发现，**两个框架的 API 惊人地相似**——学会一个，另一个几乎零成本迁移。


## 一、核心优势：为什么你再也回不去了

| 场景                 | 只用 axios                                      | 使用 TanStack Query                                  |
|----------------------|-------------------------------------------------|------------------------------------------------------|
| **缓存管理**         | 手动写 Map，还要处理过期、清理                 | 开箱即用的内存缓存，自动过期，配置简单              |
| **重复请求去重**     | 需要自己加防抖/节流，或维护 pending 状态       | 同一查询键同时发起多次，只会发一次请求              |
| **加载/错误状态**    | 每个接口都要定义三个 ref/state                 | `isPending`、`isError`、`data` 自动提供             |
| **后台数据刷新**     | 手动监听 `visibilitychange`、`online`          | `refetchOnWindowFocus`、`refetchOnReconnect` 配置项 |
| **失败重试**         | 自己写递归，容易栈溢出                         | `retry` + 指数退避，智能可靠                        |
| **分页/无限滚动**    | 手动维护页码、拼接数组、处理 loading           | `keepPreviousData`、`useInfiniteQuery` 内置支持     |
| **乐观更新**         | 几乎无法优雅实现                               | `onMutate` + `onError` + `onSettled`，清晰优雅     |
| **依赖查询**         | `useEffect` 里写 if，还要清理竞态             | `enabled` 配置项，自动取消无用请求                  |
| **开发工具**         | 浏览器 Network 面板，看不到状态流转            | 官方 Devtools，可视化缓存、查询状态、时间轴         |


## 二、安装与基础配置

### Vue3 环境

```bash
npm install @tanstack/vue-query axios
```

`main.ts` 中配置：

```typescript
import { createApp } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import App from './App.vue'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5分钟内数据为“新鲜”
      refetchOnWindowFocus: false, // 根据项目调整
      retry: 3,
    },
  },
})

createApp(App).use(VueQueryPlugin, { queryClient }).mount('#app')
```

### React 环境

```bash
npm install @tanstack/react-query axios
npm install -D @tanstack/react-query-devtools
```

`main.tsx` / `index.tsx` 中配置：

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
)
```

**⚠️ 关键概念**：
- **`staleTime`**：数据从“新鲜”变为“过时”的时间。`0` 表示数据一拿到就过时，每次访问都会重新请求。
- **`cacheTime`**：未被使用的数据保留在缓存中的时长（默认5分钟）。超过时间且无监听组件，缓存会被清理。


## 三、你的第一个查询：useQuery

### Vue3 示例

```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import axios from 'axios'

const fetchTodos = async () => {
  const { data } = await axios.get('/api/todos')
  return data
}

const { data: todos, isLoading, isError, error, refetch } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})
</script>

<template>
  <div v-if="isLoading">加载中...</div>
  <div v-else-if="isError">错误: {{ error.message }}</div>
  <ul v-else>
    <li v-for="todo in todos" :key="todo.id">{{ todo.title }}</li>
  </ul>
  <button @click="refetch">刷新</button>
</template>
```

### React 示例

```tsx
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const fetchTodos = async () => {
  const { data } = await axios.get('/api/todos')
  return data
}

export function TodoList() {
  const { data: todos, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  if (isLoading) return <div>加载中...</div>
  if (isError) return <div>错误: {error.message}</div>
  return (
    <>
      <ul>
        {todos.map(todo => <li key={todo.id}>{todo.title}</li>)}
      </ul>
      <button onClick={() => refetch()}>刷新</button>
    </>
  )
}
```

**共同点**：
- `queryKey` 是数组，唯一标识查询，用于缓存共享。
- `queryFn` 是返回 Promise 的函数。
- 返回的对象包含 `data`、`isLoading`（仅首次加载）、`isFetching`（任何网络请求）、`isError`、`error`、`refetch` 等。


## 四、查询键：缓存的灵魂

**查询键序列化后作为缓存的 key**，当键变化时，TanStack Query 会自动重新请求。

### Vue3 动态参数

```vue
<script setup>
import { ref } from 'vue'
const userId = ref(1)

const { data } = useQuery({
  queryKey: ['user', userId], // 依赖于 userId
  queryFn: () => axios.get(`/api/users/${userId.value}`).then(res => res.data),
})
</script>
<button @click="userId = 2">切换用户</button>
```

### React 动态参数

```tsx
const [userId, setUserId] = useState(1)

const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => axios.get(`/api/users/${userId}`).then(res => res.data),
})
```

**⚠️ 原则**：**任何影响查询结果的变量，都必须放入 `queryKey`**。这是 TanStack Query 的“响应式契约”。


## 五、常用配置项详解

| 配置项               | 说明                                          | 默认值    |
|----------------------|-----------------------------------------------|-----------|
| `enabled`            | 是否自动执行查询                              | `true`    |
| `staleTime`          | 数据保持新鲜的时间（毫秒）                  | `0`       |
| `cacheTime`          | 未使用数据的缓存保留时间（毫秒）            | `300000`  |
| `refetchOnWindowFocus` | 窗口聚焦时是否重新请求                     | `true`    |
| `refetchOnReconnect` | 网络重连时是否重新请求                      | `true`    |
| `retry`              | 失败重试次数                                 | `3`       |
| `select`             | 数据转换函数，返回值会替换 `data`           | -         |
| `keepPreviousData`   | 参数变化时，新数据到达前是否保留旧数据       | `false`   |

### 1. `enabled` – 依赖查询

**Vue3**（使用 `computed` 或普通 ref）
```ts
const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

const { data: userDetail } = useQuery({
  queryKey: ['user', selectedUserId],
  queryFn: () => fetchUserDetail(selectedUserId.value),
  enabled: computed(() => !!selectedUserId.value && !!users.value)
})
```

**React**（直接传入布尔值）
```jsx
const { data: users } = useQuery(['users'], fetchUsers)

const { data: userDetail } = useQuery(
  ['user', selectedUserId],
  () => fetchUserDetail(selectedUserId),
  { enabled: !!selectedUserId && !!users }
)
```

### 2. `select` – 数据转换

**Vue3**
```ts
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (todos) => todos.filter(t => !t.completed)
})
```

**React**
```tsx
const { data } = useQuery(['todos'], fetchTodos, {
  select: (todos) => todos.filter(t => !t.completed)
})
```

### 3. `keepPreviousData` – 平滑分页

**Vue3**
```ts
const { data, isFetching } = useQuery({
  queryKey: ['posts', page],
  queryFn: () => fetchPosts(page.value),
  keepPreviousData: true,
})
```

**React**
```tsx
const { data, isFetching } = useQuery(['posts', page], () => fetchPosts(page), {
  keepPreviousData: true,
})
```

## 六、数据变更：useMutation

### 传统方式的痛点

- 需要手动管理 `loading` / `error`
- 成功后需要手动触发列表刷新，组件间耦合严重
- 没有乐观更新，用户体验差

### useMutation 基础用法

**Vue3**
```vue
<script setup>
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import axios from 'axios'

const queryClient = useQueryClient()
const newTodo = ref('')

const { mutate, isPending, error } = useMutation({
  mutationFn: (title) => axios.post('/api/todos', { title }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] }) // 使列表查询失效
    newTodo.value = ''
  },
})
</script>
<template>
  <form @submit.prevent="mutate(newTodo)">
    <input v-model="newTodo" :disabled="isPending" />
    <button type="submit">{{ isPending ? '提交中' : '添加' }}</button>
    <p v-if="error">添加失败</p>
  </form>
</template>
```

**React**
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()
const [newTodo, setNewTodo] = useState('')

const { mutate, isPending, error } = useMutation({
  mutationFn: (title) => axios.post('/api/todos', { title }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
    setNewTodo('')
  },
})

return (
  <form onSubmit={(e) => { e.preventDefault(); mutate(newTodo) }}>
    <input value={newTodo} onChange={e => setNewTodo(e.target.value)} disabled={isPending} />
    <button type="submit">{isPending ? '提交中' : '添加'}</button>
    {error && <p>添加失败</p>}
  </form>
)
```

**核心思想**：mutation 成功后**不直接操作缓存**，而是让对应的查询失效（`invalidateQueries`）。TanStack Query 会自动重新请求并更新缓存，简单可靠。


## 七、大杀器：乐观更新

### 什么是乐观更新？

**悲观更新**：发请求 → 等服务器响应 → 更新 UI  
**乐观更新**：发请求 → **立即**更新 UI → 若失败则回滚

在网络延迟时，乐观更新给用户“秒响应”的体验。TanStack Query 通过 `onMutate`、`onError`、`onSettled` 三部曲完美实现。

### 完整示例：切换待办状态

**Vue3**
```vue
<script setup>
import { useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()

const { mutate: toggleTodo } = useMutation({
  mutationFn: ({ id, completed }) => 
    axios.patch(`/api/todos/${id}`, { completed }),
  onMutate: async ({ id, completed }) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previousTodos = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], (old) =>
      old?.map(todo => todo.id === id ? { ...todo, completed } : todo)
    )
    return { previousTodos }
  },
  onError: (error, variables, context) => {
    queryClient.setQueryData(['todos'], context?.previousTodos)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
</script>
```

**React**
```tsx
const queryClient = useQueryClient()

const { mutate: toggleTodo } = useMutation({
  mutationFn: ({ id, completed }) =>
    axios.patch(`/api/todos/${id}`, { completed }),
  onMutate: async ({ id, completed }) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previousTodos = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], (old) =>
      old?.map(todo => todo.id === id ? { ...todo, completed } : todo)
    )
    return { previousTodos }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['todos'], context?.previousTodos)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

**三部曲详解**：

| 回调        | 调用时机           | 典型职责                                 |
|-------------|--------------------|------------------------------------------|
| `onMutate`  | mutation 执行**前** | 取消冲突请求，保存快照，立即更新缓存     |
| `onError`   | mutation 失败时     | 使用快照回滚缓存                         |
| `onSettled` | mutation 完成后     | 重新获取数据，确保与服务器同步（可选）   |

### 删除与添加的乐观更新

**删除**：直接从缓存中移除条目。  
**添加**：先生成临时 ID，成功后用真实数据替换。

（代码示例略，参考 Vue3/React 均可轻松实现）


## 八、高级实战场景

### 1. 分页查询

**Vue3**
```ts
const page = ref(1)
const { data, isPreviousData } = useQuery({
  queryKey: ['projects', page],
  queryFn: () => fetchProjects(page.value),
  keepPreviousData: true,
})
```

**React**
```tsx
const [page, setPage] = useState(1)
const { data, isPreviousData } = useQuery(
  ['projects', page],
  () => fetchProjects(page),
  { keepPreviousData: true }
)
```

### 2. 无限滚动（useInfiniteQuery）

**Vue3**
```ts
import { useInfiniteQuery } from '@tanstack/vue-query'

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam = 0 }) => fetchProjects(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: 0,
})
```

**React**
```tsx
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam = 0 }) => fetchProjects(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: 0,
})
```

### 3. 并行查询

**Vue3**
```ts
import { useQueries } from '@tanstack/vue-query'

const results = useQueries({
  queries: [
    { queryKey: ['user', 1], queryFn: () => fetchUser(1) },
    { queryKey: ['user', 2], queryFn: () => fetchUser(2) },
    { queryKey: ['user', 3], queryFn: () => fetchUser(3) },
  ],
})
```

**React**
```tsx
const results = useQueries({
  queries: [
    { queryKey: ['user', 1], queryFn: () => fetchUser(1) },
    { queryKey: ['user', 2], queryFn: () => fetchUser(2) },
    { queryKey: ['user', 3], queryFn: () => fetchUser(3) },
  ],
})
```

### 4. 轮询（实时数据）

**Vue3**
```ts
useQuery({
  queryKey: ['liveData'],
  queryFn: fetchLiveData,
  refetchInterval: 5000, // 5秒
})
```

**React** 完全一致。


## 九、与 HTTP 客户端的完美配合

**axios 只是“手”，TanStack Query 是“大脑”**。

推荐架构：

```
api/
  axios.js      // 封装拦截器、baseURL
  todos.js      // 纯数据获取函数
  users.js
hooks/          // React 专属
  useTodos.js   // 封装 useQuery + useMutation
composables/    // Vue3 专属
  useTodos.js   // 封装 useQuery + useMutation
```

**axios 封装示例**：
```js
// api/axios.js
import axios from 'axios'
export const api = axios.create({ baseURL: '/api' })
api.interceptors.response.use(res => res.data)
```

**数据获取函数**：
```js
// api/todos.js
import { api } from './axios'
export const fetchTodos = () => api.get('/todos')
export const addTodo = (title) => api.post('/todos', { title })
```

**组件中使用 TanStack Query**（Vue3 或 React）：
```ts
import { useQuery, useMutation } from '@tanstack/vue-query'
import { fetchTodos, addTodo } from '../api/todos'
```

这样，数据获取逻辑与 UI 彻底解耦，且可在不同框架间复用。

## 十、框架对比总结

| 方面               | Vue3                                     | React                                     |
|--------------------|------------------------------------------|-------------------------------------------|
| 包名               | `@tanstack/vue-query`                   | `@tanstack/react-query`                  |
| Provider           | `VueQueryPlugin`                        | `QueryClientProvider`                    |
| Hook 命名          | `useQuery`, `useMutation`, 等           | 完全相同                                 |
| 响应式             | 返回值是 `ref`，模板自动解包            | 返回值是稳定引用，组件重新渲染时更新     |
| 动态 enabled       | 需用 `computed` 或函数形式              | 直接传入布尔值                           |
| 开发工具           | 独立安装 `@tanstack/vue-query-devtools`| `@tanstack/react-query-devtools`         |
| 社区与生态         | 较新，但 API 与 React 版完全对齐        | 成熟，文档丰富                           |

**核心学习成本**：只要掌握一个框架的用法，另一个框架只需查阅对应的 Hook 导入路径，几乎零成本迁移。


## 十一、为什么你应该从现在开始使用 TanStack Query

1. **减少 70% 的数据获取代码**：不再需要手动定义 loading/error，不再需要 useEffect/onMounted。
2. **用户体验飞跃**：缓存、后台刷新、乐观更新，让应用响应如飞。
3. **极低的上手门槛**：API 设计直觉，且跨框架一致。
4. **强大的调试工具**：Devtools 可视化所有查询状态，排查问题一目了然。
5. **社区标准**：已成为 React 生态事实标准，Vue 生态也快速跟进。

**不要再把 axios 当作状态管理工具了**。它只是一个 HTTP 客户端，把状态管理的脏活累活还给专业的 TanStack Query。


## 十二、资源与下一步

- 📘 **官方文档**：[Vue](https://tanstack.com/query/latest/docs/framework/vue/overview) | [React](https://tanstack.com/query/latest/docs/framework/react/overview)
- 🔧 **Devtools**：务必安装，开发必备
- 🧪 **在线演练**：[Vue 示例](https://stackblitz.com/github/tanstack/query/tree/main/examples/vue/simple) | [React 示例](https://stackblitz.com/github/tanstack/query/tree/main/examples/react/simple)

