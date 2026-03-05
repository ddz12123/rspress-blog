# TanStack Query 在 Vue3 中的完整新手指南（v5）

> 面向对象：第一次接触 TanStack Query 的同学（Vue3 + `<script setup>`）  
> 学习目标：掌握 `useQuery`、`useMutation` 的核心参数、状态和常见业务写法

---

## 1. 先搞懂它到底解决什么问题

在 Vue 里直接 `watch + fetch` 也能请求数据，但很快会遇到：

- 同接口重复请求
- 列表、详情、弹窗都要自己维护缓存一致性
- 重新聚焦页面、断网恢复、错误重试都要自己写

TanStack Query 专门解决“服务端状态管理”。

- `useQuery`：读数据（GET）
- `useMutation`：写数据（POST/PUT/PATCH/DELETE）

---

## 2. 官方默认行为（新手一定要先知道）

这部分来自官方 `Important Defaults`：

- Query 默认是 `stale`（过期）状态。
- 过期 Query 在挂载、窗口聚焦、网络恢复时可能自动重新请求。
- 非活跃 Query 默认约 `5` 分钟后回收（`gcTime`）。
- Query 默认失败重试 `3` 次（指数退避）。
- Mutation 默认失败不重试（`retry: 0`）。

---

## 3. 安装和初始化（只做一次）

```bash
pnpm add @tanstack/vue-query
```

```ts
// src/main.ts
import { createApp } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'

const app = createApp(App)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

app.use(VueQueryPlugin, { queryClient })
app.mount('#app')
```


## 4. `useQuery`：核心参数 + 返回值

### 4.1 基本写法

```ts
const result = useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) => fetchTodos({ signal }),
})
```

### 4.2 `useQuery` 主要参数（按优先级）

| 参数 | 作用 | 是否常用 | 新手建议 |
| --- | --- | --- | --- |
| `queryKey` | 缓存键（唯一标识） | 必会 | 用数组；参数变更就体现在 key 里 |
| `queryFn` | 请求函数 | 必会 | 把 `signal` 传给请求库 |
| `enabled` | 是否允许自动执行 | 高频 | 依赖条件时用 `computed`/getter |
| `staleTime` | 多少时间内算“新鲜” | 高频 | 列表一般 `30s ~ 5min` |
| `gcTime` | 非活跃缓存存活时间 | 常用 | 默认 5 分钟可先不改 |
| `retry` | 失败重试次数 | 常用 | 后台不稳定可设 `1~2` |
| `select` | 转换数据 | 常用 | 提供给视图“已变形数据” |
| `placeholderData` | 占位数据策略 | 常用 | 分页时常用 `keepPreviousData` |
| `refetchOnWindowFocus` | 回到页面是否刷新 | 常用 | 中后台常设 `false` |

### 4.3 `useQuery` 常见返回值

| 返回值 | 含义 | 典型用法 |
| --- | --- | --- |
| `data` | 接口数据（`Ref`） | 渲染页面 |
| `error` | 错误对象（`Ref`） | 错误提示 |
| `status` | `pending / error / success` | 统一状态机 |
| `fetchStatus` | `fetching / paused / idle` | 网络状态判断 |
| `isPending` | 首次加载 | 首屏 loading |
| `isFetching` | 正在请求（含后台刷新） | 顶部“刷新中”提示 |
| `isLoading` | `isPending && isFetching` | 懒查询场景常用 |
| `isPlaceholderData` | 当前是占位数据 | 分页按钮禁用判断 |
| `refetch` | 手动重拉 | 按钮刷新 |

---

## 5. `useQuery` 常用场景（带示例）

### 5.1 场景 A：页面打开自动拉列表

```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

type Todo = { id: number; title: string; completed: boolean }

async function fetchTodos({ signal }: { signal?: AbortSignal }) {
  const res = await fetch('/api/todos', { signal })
  if (!res.ok) throw new Error('获取待办失败')
  return (await res.json()) as Todo[]
}

const { data, isPending, isError, error, isFetching } = useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) => fetchTodos({ signal }),
  staleTime: 30_000,
})
</script>

<template>
  <p v-if="isPending">加载中...</p>
  <p v-else-if="isError">错误：{{ (error as Error).message }}</p>
  <div v-else>
    <ul>
      <li v-for="todo in data" :key="todo.id">{{ todo.title }}</li>
    </ul>
    <small v-if="isFetching">后台刷新中...</small>
  </div>
</template>
```

### 5.2 场景 B：依赖查询（Dependent Query）

先拿用户，再拿该用户的项目。官方建议用 `enabled`。

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'

type User = { id: number; name: string }
type Project = { id: number; name: string }

const email = 'alice@example.com'

const getUserByEmail = async (value: string): Promise<User> => {
  const res = await fetch(`/api/users?email=${encodeURIComponent(value)}`)
  if (!res.ok) throw new Error('查询用户失败')
  return res.json()
}

const getProjectsByUser = async (userId: number): Promise<Project[]> => {
  const res = await fetch(`/api/projects?userId=${userId}`)
  if (!res.ok) throw new Error('查询项目失败')
  return res.json()
}

const userQuery = useQuery({
  queryKey: ['user', email],
  queryFn: () => getUserByEmail(email),
})

const userId = computed(() => userQuery.data.value?.id)

const projectsQuery = useQuery({
  queryKey: ['projects', userId],
  queryFn: () => getProjectsByUser(userId.value as number),
  enabled: computed(() => !!userId.value),
})
</script>

<template>
  <p v-if="userQuery.isPending || projectsQuery.isPending">加载中...</p>
  <p v-else-if="userQuery.isError">用户加载失败</p>
  <p v-else-if="projectsQuery.isError">项目加载失败</p>
  <ul v-else>
    <li v-for="p in projectsQuery.data" :key="p.id">{{ p.name }}</li>
  </ul>
</template>
```

### 5.3 场景 C：分页查询避免 UI 闪烁（官方 `keepPreviousData`）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'

type ProjectsPage = {
  items: { id: number; name: string }[]
  hasMore: boolean
}

const page = ref(1)

async function fetchProjects(currentPage: number): Promise<ProjectsPage> {
  const res = await fetch(`/api/projects?page=${currentPage}`)
  if (!res.ok) throw new Error('分页查询失败')
  return res.json()
}

const { data, isPending, isFetching, isPlaceholderData } = useQuery({
  queryKey: ['projects', page],
  queryFn: () => fetchProjects(page.value),
  placeholderData: keepPreviousData,
})
</script>

<template>
  <p v-if="isPending">加载中...</p>
  <div v-else>
    <p v-for="item in data?.items" :key="item.id">{{ item.name }}</p>
    <button :disabled="page === 1" @click="page = Math.max(1, page - 1)">上一页</button>
    <button :disabled="isPlaceholderData || !data?.hasMore" @click="page = page + 1">
      下一页
    </button>
    <span v-if="isFetching"> 加载中...</span>
  </div>
</template>
```

### 5.4 场景 D：懒查询（`enabled: false`）的正确理解

```ts
const query = useQuery({
  queryKey: ['users', keyword],
  queryFn: () => searchUsers(keyword.value),
  enabled: false,
})

query.refetch()
```

官方要点：

- `enabled: false` 时不会自动请求。
- 会忽略 `invalidateQueries`/`refetchQueries` 的自动触发能力。
- 若只是“条件满足再查”，更推荐 `enabled: computed(() => !!keyword.value)`。

---

## 6. `useMutation`：核心参数 + 返回值

### 6.1 基本写法

```ts
const mutation = useMutation({
  mutationFn: createTodo,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})
```

### 6.2 `useMutation` 主要参数

| 参数 | 作用 | 是否常用 | 新手建议 |
| --- | --- | --- | --- |
| `mutationFn` | 执行写操作 | 必会 | 参数尽量用对象 |
| `onMutate` | 发请求前（乐观更新） | 进阶高频 | 先快更 UI，再失败回滚 |
| `onSuccess` | 成功后 | 必会 | 刷新 Query 或直接写缓存 |
| `onError` | 失败后 | 必会 | 提示错误、回滚 |
| `onSettled` | 无论成功失败都会执行 | 常用 | 统一收尾逻辑 |
| `retry` | 失败重试次数 | 常用 | 写操作默认不重试 |
| `mutationKey` | mutation 分组标识 | 可选 | 复杂场景再使用 |

### 6.3 `useMutation` 常见返回值

| 返回值 | 含义 | 常见用途 |
| --- | --- | --- |
| `mutate` | 触发提交（回调） | 按钮点击 |
| `mutateAsync` | 触发提交（Promise） | `await` 串流程 |
| `status` | `idle / pending / error / success` | 状态展示 |
| `isPending` | 提交中 | 按钮禁用 |
| `isError` | 提交失败 | 错误提示 |
| `isSuccess` | 提交成功 | 成功提示 |
| `error` | 错误对象 | 文案细化 |
| `variables` | 最近一次提交参数 | 回显 |
| `reset` | 重置状态 | 关闭弹窗后清状态 |

---

## 7. `useMutation` 常用场景（带示例）

### 7.1 场景 A：新增成功后失效刷新（官方推荐）

```vue
<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()

async function addTodo(payload: { title: string }) {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('新增失败')
  return res.json()
}

const mutation = useMutation({
  mutationFn: addTodo,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
</script>

<template>
  <button :disabled="mutation.isPending" @click="mutation.mutate({ title: '学习 TanStack Query' })">
    {{ mutation.isPending ? '提交中...' : '新增' }}
  </button>
</template>
```

### 7.2 场景 B：用 mutation 返回值直接更新缓存（官方 `setQueryData`）

```vue
<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'

type Todo = { id: number; title: string; completed: boolean }

const queryClient = useQueryClient()

async function editTodo(input: { id: number; title: string }): Promise<Todo> {
  const res = await fetch(`/api/todos/${input.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: input.title }),
  })
  if (!res.ok) throw new Error('更新失败')
  return res.json()
}

const mutation = useMutation({
  mutationFn: editTodo,
  onSuccess: (updatedTodo, variables) => {
    queryClient.setQueryData(['todo', { id: variables.id }], updatedTodo)
  },
})
</script>

<template>
  <button @click="mutation.mutate({ id: 1, title: '新标题' })">更新标题</button>
</template>
```

注意：`setQueryData` 要返回新数据，不要直接改旧对象。

### 7.3 场景 C：乐观更新（官方常见模板）

```vue
<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'

type Todo = { id: number; title: string; completed: boolean }

const queryClient = useQueryClient()

async function createTodo(payload: { title: string }): Promise<Todo> {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('新增失败')
  return res.json()
}

const mutation = useMutation({
  mutationFn: createTodo,
  onMutate: async (newTodo, context) => {
    await context.client.cancelQueries({ queryKey: ['todos'] })
    const previousTodos = context.client.getQueryData<Todo[]>(['todos'])

    context.client.setQueryData<Todo[]>(['todos'], (old = []) => [
      ...old,
      { id: -1, title: newTodo.title, completed: false },
    ])

    return { previousTodos }
  },
  onError: (_error, _variables, onMutateResult, context) => {
    context.client.setQueryData(['todos'], onMutateResult?.previousTodos)
  },
  onSettled: async (_data, _error, _variables, _onMutateResult, context) => {
    await context.client.invalidateQueries({ queryKey: ['todos'] })
  },
})
</script>

<template>
  <button @click="mutation.mutate({ title: '先乐观更新' })">乐观新增</button>
</template>
```

---

## 8. Vue 场景下特别要注意的点

- `queryKey` 里放响应式值时，优先放 `ref`/getter，不要过早解包成固定值。
- `enabled` 推荐用 `computed` 或 getter，让依赖变化时自动重新评估。
- 组合式函数封装查询时，参数尽量支持 `Ref` 或 getter（见官方 `Reactivity` 指南）。
- 一样要把 `signal` 传给请求层，才有自动取消能力。

---

## 9. 新手最容易踩的坑

- 把写操作放进 `useQuery`，导致语义和状态都混乱。
- `queryKey` 没带参数，分页/筛选共用同一缓存。
- 把 `isFetching` 当成“全屏 loading”，造成界面闪烁。
- `enabled: false` 滥用，丢失声明式刷新能力。
- `setQueryData` 直接原地修改对象，造成不可预期行为。

---

## 10. 实战记忆卡（新人版）

- GET：`useQuery`
- POST/PUT/PATCH/DELETE：`useMutation`
- 提交成功后优先考虑：`invalidateQueries`
- 首屏 loading：`isPending`
- 后台刷新提示：`isFetching`
- 依赖条件查询：`enabled`
- 分页不闪屏：`placeholderData: keepPreviousData`

---

## 11. 官方文档（建议按顺序看）

- Quick Start  
  https://tanstack.com/query/v5/docs/framework/vue/quick-start
- `useQuery` API  
  https://tanstack.com/query/v5/docs/framework/vue/reference/useQuery
- `useMutation` API  
  https://tanstack.com/query/v5/docs/framework/vue/reference/useMutation
- Query Keys  
  https://tanstack.com/query/v5/docs/framework/vue/guides/query-keys
- Dependent Queries  
  https://tanstack.com/query/v5/docs/framework/vue/guides/dependent-queries
- Disabling/Pausing Queries  
  https://tanstack.com/query/v5/docs/framework/vue/guides/disabling-queries
- Paginated Queries  
  https://tanstack.com/query/v5/docs/framework/vue/guides/paginated-queries
- Query Cancellation  
  https://tanstack.com/query/v5/docs/framework/vue/guides/query-cancellation
- Invalidations from Mutations  
  https://tanstack.com/query/v5/docs/framework/vue/guides/invalidations-from-mutations
- Updates from Mutation Responses  
  https://tanstack.com/query/v5/docs/framework/vue/guides/updates-from-mutation-responses
- Optimistic Updates  
  https://tanstack.com/query/v5/docs/framework/vue/guides/optimistic-updates
- Vue Reactivity  
  https://tanstack.com/query/v5/docs/framework/vue/reactivity
