# TanStack Query 在 React 中的完整新手指南（v5）

> 面向对象：第一次接触 TanStack Query 的同学（React 18+）  
> 学习目标：掌握 `useQuery`、`useMutation` 的核心参数、状态和常见业务写法


## 1. 先搞懂它到底解决什么问题

在 React 里直接用 `fetch + useEffect`，你很快会遇到这些问题：

- 同一个接口被重复请求
- 切页面回来又要重新写加载状态
- 缓存、重试、后台刷新、错误重试都要自己管

TanStack Query 把这些“服务端状态管理”统一处理了。

- `useQuery`：读数据（GET）
- `useMutation`：写数据（POST/PUT/PATCH/DELETE）

---

## 2. 官方默认行为（新手一定要先知道）

这部分来自官方 `Important Defaults`，很多“看起来奇怪”的行为其实是默认配置：

- Query 默认会被认为是 `stale`（过期）。
- 过期 Query 在这些时机可能自动重新请求：组件挂载、窗口重新聚焦、网络恢复。
- 非活跃 Query（页面没在用）默认约 `5` 分钟后被垃圾回收（`gcTime`）。
- Query 默认失败重试 `3` 次（指数退避）。
- Mutation 默认失败不重试（`retry: 0`）。

---

## 3. 安装和初始化（只做一次）

```bash
pnpm add @tanstack/react-query
```

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

---

## 4. `useQuery`：核心参数 + 返回值

### 4.1 基本写法

```tsx
const result = useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) => fetchTodos({ signal }),
})
```

### 4.2 `useQuery` 主要参数（按优先级）

| 参数 | 作用 | 是否常用 | 新手建议 |
| --- | --- | --- | --- |
| `queryKey` | 缓存键（唯一标识） | 必会 | 一律用数组：`['todos', page, filters]` |
| `queryFn` | 请求函数 | 必会 | 把 `signal` 传给请求库，支持自动取消 |
| `enabled` | 是否允许自动执行 | 高频 | 依赖参数时用：`enabled: !!id` |
| `staleTime` | 多少时间内算“新鲜” | 高频 | 列表一般 `30s ~ 5min` |
| `gcTime` | 非活跃缓存存活时间 | 常用 | 默认 5 分钟可先不改 |
| `retry` | 失败重试次数 | 常用 | 后台不稳定可设 `1~2` |
| `select` | 转换返回数据 | 常用 | 给组件产出“已变形数据” |
| `placeholderData` | 占位数据策略 | 常用 | 分页时常用 `keepPreviousData` |
| `refetchOnWindowFocus` | 回到页面是否自动刷新 | 常用 | 中后台常设 `false` |

### 4.3 `useQuery` 常见返回值

| 返回值 | 含义 | 典型用法 |
| --- | --- | --- |
| `data` | 接口数据 | 渲染页面 |
| `error` | 错误对象 | 错误提示 |
| `status` | `pending / error / success` | 统一状态机 |
| `fetchStatus` | `fetching / paused / idle` | 判断网络层状态 |
| `isPending` | 首次加载 | 首屏 loading |
| `isFetching` | 正在请求（含后台刷新） | 顶部“刷新中”提示 |
| `isLoading` | `isPending && isFetching` | 懒查询场景常用 |
| `isPlaceholderData` | 当前是占位数据 | 分页按钮禁用判断 |
| `refetch` | 手动重拉 | 点击按钮刷新 |

---

## 5. `useQuery` 常用场景（带示例）

### 5.1 场景 A：页面打开自动拉列表

```tsx
import { useQuery } from '@tanstack/react-query'

type Todo = { id: number; title: string; completed: boolean }

async function fetchTodos({ signal }: { signal?: AbortSignal }) {
  const res = await fetch('/api/todos', { signal })
  if (!res.ok) throw new Error('获取待办失败')
  return (await res.json()) as Todo[]
}

export function TodoList() {
  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: ['todos'],
    queryFn: ({ signal }) => fetchTodos({ signal }),
    staleTime: 30_000,
  })

  if (isPending) return <p>加载中...</p>
  if (isError) return <p>错误：{(error as Error).message}</p>

  return (
    <div>
      <ul>
        {data?.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
      {isFetching ? <small>后台刷新中...</small> : null}
    </div>
  )
}
```

### 5.2 场景 B：依赖查询（Dependent Query）

先拿用户，再拿该用户的项目。官方建议用 `enabled` 控制第二个查询。

```tsx
import { useQuery } from '@tanstack/react-query'

type User = { id: number; name: string }
type Project = { id: number; name: string }

const getUserByEmail = async (email: string): Promise<User> => {
  const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`)
  if (!res.ok) throw new Error('查询用户失败')
  return res.json()
}

const getProjectsByUser = async (userId: number): Promise<Project[]> => {
  const res = await fetch(`/api/projects?userId=${userId}`)
  if (!res.ok) throw new Error('查询项目失败')
  return res.json()
}

export function ProjectListByEmail({ email }: { email: string }) {
  const userQuery = useQuery({
    queryKey: ['user', email],
    queryFn: () => getUserByEmail(email),
  })

  const userId = userQuery.data?.id

  const projectsQuery = useQuery({
    queryKey: ['projects', userId],
    queryFn: () => getProjectsByUser(userId as number),
    enabled: !!userId,
  })

  if (userQuery.isPending || projectsQuery.isPending) return <p>加载中...</p>
  if (userQuery.isError) return <p>用户加载失败</p>
  if (projectsQuery.isError) return <p>项目加载失败</p>

  return (
    <ul>
      {projectsQuery.data?.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  )
}
```

### 5.3 场景 C：分页查询避免 UI 闪烁（官方 `keepPreviousData`）

```tsx
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

type ProjectsPage = {
  items: { id: number; name: string }[]
  hasMore: boolean
}

async function fetchProjects(page: number): Promise<ProjectsPage> {
  const res = await fetch(`/api/projects?page=${page}`)
  if (!res.ok) throw new Error('分页查询失败')
  return res.json()
}

export function ProjectPager() {
  const [page, setPage] = useState(1)

  const { data, isPending, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['projects', page],
    queryFn: () => fetchProjects(page),
    placeholderData: keepPreviousData,
  })

  if (isPending) return <p>加载中...</p>

  return (
    <div>
      {data?.items.map((item) => (
        <p key={item.id}>{item.name}</p>
      ))}
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
        上一页
      </button>
      <button
        onClick={() => setPage((p) => p + 1)}
        disabled={isPlaceholderData || !data?.hasMore}
      >
        下一页
      </button>
      {isFetching ? <span> 加载中...</span> : null}
    </div>
  )
}
```

### 5.4 场景 D：懒查询（`enabled: false`）的正确理解

```tsx
const query = useQuery({
  queryKey: ['users', keyword],
  queryFn: () => searchUsers(keyword),
  enabled: false,
})

// 手动触发
query.refetch()
```

官方要点（很重要）：

- `enabled: false` 时不会自动请求。
- 会忽略 `invalidateQueries`/`refetchQueries` 的自动触发能力。
- 这种写法偏命令式。若只是“有关键词再查”，更推荐：

```tsx
enabled: keyword.trim().length > 0
```

---

## 6. `useMutation`：核心参数 + 返回值

### 6.1 基本写法

```tsx
const mutation = useMutation({
  mutationFn: createTodo,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})
```

### 6.2 `useMutation` 主要参数

| 参数 | 作用 | 是否常用 | 新手建议 |
| --- | --- | --- | --- |
| `mutationFn` | 执行写操作 | 必会 | 参数尽量用对象，后续扩展方便 |
| `onMutate` | 发请求前（乐观更新） | 进阶高频 | 先快更 UI，再失败回滚 |
| `onSuccess` | 成功后 | 必会 | 刷新相关 Query 或直接写缓存 |
| `onError` | 失败后 | 必会 | 提示错误、回滚 |
| `onSettled` | 无论成功失败都会执行 | 常用 | 统一收尾逻辑 |
| `retry` | 失败重试次数 | 常用 | 写操作默认不重试，按业务决定 |
| `mutationKey` | mutation 分组标识 | 可选 | 多 mutation 管理时使用 |

### 6.3 `useMutation` 常见返回值

| 返回值 | 含义 | 常见用途 |
| --- | --- | --- |
| `mutate` | 触发提交（回调） | 按钮点击 |
| `mutateAsync` | 触发提交（Promise） | `await` 串流程 |
| `status` | `idle / pending / error / success` | 状态展示 |
| `isPending` | 提交中 | 按钮禁用、防抖 |
| `isError` | 提交失败 | 错误信息 |
| `isSuccess` | 提交成功 | 成功提示 |
| `error` | 错误对象 | 文案细化 |
| `variables` | 最近一次提交参数 | 回显 |
| `reset` | 重置 mutation 状态 | 关闭弹窗后清状态 |

---

## 7. `useMutation` 常用场景（带示例）

### 7.1 场景 A：新增成功后失效刷新（官方推荐）

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

async function addTodo(payload: { title: string }) {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('新增失败')
  return res.json()
}

export function AddTodo() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: addTodo,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <button onClick={() => mutation.mutate({ title: '学习 TanStack Query' })} disabled={mutation.isPending}>
      {mutation.isPending ? '提交中...' : '新增'}
    </button>
  )
}
```

### 7.2 场景 B：用 mutation 返回值直接更新缓存（官方 `setQueryData`）

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

type Todo = { id: number; title: string; completed: boolean }

async function editTodo(input: { id: number; title: string }): Promise<Todo> {
  const res = await fetch(`/api/todos/${input.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: input.title }),
  })
  if (!res.ok) throw new Error('更新失败')
  return res.json()
}

export function EditTodoButton() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: editTodo,
    onSuccess: (updatedTodo, variables) => {
      queryClient.setQueryData(['todo', { id: variables.id }], updatedTodo)
    },
  })

  return <button onClick={() => mutation.mutate({ id: 1, title: '新标题' })}>更新标题</button>
}
```

注意：`setQueryData` 必须返回新对象，不要原地修改旧对象。

### 7.3 场景 C：乐观更新（官方常见模板）

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

type Todo = { id: number; title: string; completed: boolean }

async function createTodo(payload: { title: string }): Promise<Todo> {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('新增失败')
  return res.json()
}

export function AddTodoWithOptimisticUI() {
  const queryClient = useQueryClient()

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

  return <button onClick={() => mutation.mutate({ title: '先乐观更新' })}>乐观新增</button>
}
```

---

## 8. 新手最容易踩的坑

- 把写操作放进 `useQuery`，导致语义和状态都混乱。
- `queryKey` 没带参数，分页/筛选共用同一缓存。
- 看到 `isFetching` 就整页 loading，体验会闪烁。
- `enabled: false` 用多了，失去 TanStack Query 的声明式优势。
- 忘记把 `signal` 传给请求函数，取消请求能力失效。
- `setQueryData` 直接改旧对象，导致缓存更新行为异常。

---

## 9. 实战记忆卡（新人版）

- GET：`useQuery`
- POST/PUT/PATCH/DELETE：`useMutation`
- 提交成功后优先考虑：`invalidateQueries`
- 首屏 loading：`isPending`
- 后台刷新提示：`isFetching`
- 依赖条件查询：`enabled`
- 分页不闪屏：`placeholderData: keepPreviousData`

---

## 10. 官方文档（建议按顺序看）

- Quick Start  
  https://tanstack.com/query/v5/docs/framework/react/quick-start
- `useQuery` API  
  https://tanstack.com/query/v5/docs/framework/react/reference/useQuery
- `useMutation` API  
  https://tanstack.com/query/v5/docs/framework/react/reference/useMutation
- Query Keys  
  https://tanstack.com/query/v5/docs/framework/react/guides/query-keys
- Dependent Queries  
  https://tanstack.com/query/v5/docs/framework/react/guides/dependent-queries
- Disabling/Pausing Queries  
  https://tanstack.com/query/v5/docs/framework/react/guides/disabling-queries
- Paginated Queries  
  https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries
- Query Cancellation  
  https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation
- Invalidations from Mutations  
  https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations
- Updates from Mutation Responses  
  https://tanstack.com/query/v5/docs/framework/react/guides/updates-from-mutation-responses
- Optimistic Updates  
  https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates
- Important Defaults  
  https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults
