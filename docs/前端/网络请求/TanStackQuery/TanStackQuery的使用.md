# TanStackQuery在Vue3中的完全指南

## 引言：为什么你迫切需要放弃“axios 裸奔”

作为一名 Vue3 开发者，你肯定写过这样的代码：

```vue
<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const todos = ref([])
const loading = ref(false)
const error = ref(null)

const fetchTodos = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await axios.get('/api/todos')
    todos.value = res.data
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchTodos)
</script>
```

这段代码看似完美，但当你的应用膨胀到几十个页面时，噩梦就开始了：

- **重复请求**：A 组件请求了数据，B 组件又请求一次，明明数据一模一样，却发了两次请求。
- **缓存失效**：用户编辑了一条数据，列表却还显示旧内容，你不得不在编辑成功后手动重新调用 `fetchTodos`。
- **加载状态爆炸**：每个组件都要写 `loading`、`error`、`data` 三个响应式变量，模板里全是 `v-if`。
- **竞态条件**：快速切换页码时，先发的请求后返回，页面数据闪成“鬼畜”。
- **后台刷新**：用户把页面挂了一夜，回来看到的数据还是昨天的，没有任何机制自动更新。

这些痛苦的本质是什么？**axios 只是一个 HTTP 客户端，它只管发请求、收响应，而管理数据状态的责任，完全落在了开发者肩上**。

**TanStack Query**（曾用名 Vue Query）正是为了解决这一系列问题而生的。它不是要替代 axios，而是站在 axios 的肩膀上，帮你把“发请求”和“管数据”彻底分开。你只需要告诉它：“嘿，我需要这些数据”，剩下的缓存、更新、重试、后台刷新，它全包了。

本文将带你从零开始，以最详尽的代码示例，掌握 TanStack Query 在 Vue3 中的核心用法。无论你是刚接触 Vue3 还是已经有一定经验，读完本文后，你都能写出更优雅、更健壮的数据获取代码。


## 一、安装与基础配置

### 1.1 安装依赖

```bash
npm install @tanstack/vue-query axios
# 或
yarn add @tanstack/vue-query axios
```

### 1.2 创建 QueryClient 并注册插件

在 `main.ts` 中完成全局配置：

```typescript
// main.ts
import { createApp } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import App from './App.vue'

// QueryClient 是整个库的“大脑”，负责管理所有查询的缓存和配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,                      // 请求失败时自动重试 3 次
      staleTime: 1000 * 60 * 5,     // 数据在 5 分钟内被认为是“新鲜的”，不会触发后台刷新
      refetchOnWindowFocus: false,  // 窗口聚焦时不自动重新请求（可根据项目调整）
      refetchOnReconnect: true,     // 网络重连时自动重新请求
    },
    mutations: {
      retry: 1,                     // mutation 失败时重试 1 次
    },
  },
})

const app = createApp(App)

// 注册插件，并将 queryClient 注入整个应用
app.use(VueQueryPlugin, { queryClient })

app.mount('#app')
```

**关键解释**：
- `staleTime`：数据从“新鲜”变为“过时”的时间。0 表示数据一拿到就过时，每次访问都会重新请求。合理设置 `staleTime` 可以极大减少不必要的网络请求。
- `cacheTime`：未被使用的数据保留在缓存中的时间，默认 5 分钟。当一个查询没有任何组件使用时，超过 `cacheTime` 后会被垃圾回收。


## 二、你的第一个查询：useQuery 基础

### 2.1 定义 API 函数（使用 axios）

```typescript
// api/todos.ts
import axios from 'axios'

export interface Todo {
  id: number
  title: string
  completed: boolean
}

export const fetchTodos = async (): Promise<Todo[]> => {
  const response = await axios.get('https://jsonplaceholder.typicode.com/todos?_limit=10')
  return response.data
}
```

### 2.2 在组件中使用 useQuery

```vue
<!-- components/TodoList.vue -->
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { fetchTodos } from '../api/todos'

// useQuery 返回的对象包含所有你需要的状态
const {
  data: todos,        // 响应式数据，请求成功后自动更新
  isLoading,          // 是否正在**首次**加载
  isError,            // 是否发生错误
  error,              // 错误对象
  isSuccess,          // 是否成功
  refetch,            // 手动重新请求的函数
} = useQuery({
  queryKey: ['todos'],   // ❶ 唯一标识这个查询的键
  queryFn: fetchTodos,   // ❷ 返回 Promise 的函数
})
</script>

<template>
  <div class="todo-list">
    <h2>待办事项列表</h2>

    <!-- 首次加载状态 -->
    <div v-if="isLoading" class="loading">
      ⏳ 加载中...
    </div>

    <!-- 错误状态 -->
    <div v-else-if="isError" class="error">
      ❌ 加载失败: {{ error.message }}
      <button @click="refetch">重试</button>
    </div>

    <!-- 成功状态 -->
    <div v-else-if="isSuccess">
      <ul>
        <li
          v-for="todo in todos"
          :key="todo.id"
          :class="{ completed: todo.completed }"
        >
          {{ todo.title }}
        </li>
      </ul>
      <button @click="refetch" class="refresh-btn">
        🔄 刷新数据
      </button>
    </div>
  </div>
</template>

<style scoped>
.completed {
  text-decoration: line-through;
  color: #999;
}
</style>
```

**体验对比**：相比直接用 axios，你省去了手动定义 `loading`、`error`、`data` 变量，也省去了 `try-catch` 和 `onMounted`。更重要的是，当你**再次访问这个组件时，数据会从缓存中瞬间出现**，而不是重新加载。


## 三、查询键：缓存的核心

`queryKey` 是一个**数组**，用来唯一标识一个查询。TanStack Query 会**序列化**这个数组作为缓存的键。

```typescript
// 以下三个查询拥有不同的缓存
useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
useQuery({ queryKey: ['todos', 1], queryFn: () => fetchTodo(1) })
useQuery({ queryKey: ['todos', 2], queryFn: () => fetchTodo(2) })
```

**当查询键变化时，useQuery 会自动重新请求**。利用这一特性，我们可以轻松实现**动态参数查询**：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'

const userId = ref(1)

const { data: user } = useQuery({
  // 查询键依赖 userId，userId 变化 => 查询键变化 => 自动重新请求
  queryKey: ['user', userId],
  queryFn: () => axios.get(`/api/users/${userId.value}`).then(res => res.data),
})
</script>

<template>
  <div>
    <button @click="userId = 1">用户1</button>
    <button @click="userId = 2">用户2</button>
    <button @click="userId = 3">用户3</button>
    <div v-if="user">{{ user.name }}</div>
  </div>
</template>
```

**⚠️ 关键原则**：**任何影响查询结果的变量，都必须放在 `queryKey` 中**。这是 TanStack Query 的“响应式契约”。


## 四、useQuery 高阶配置：精细控制

### 4.1 `enabled` – 控制查询的执行时机

```typescript
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId.value),
  // 只有 userId 大于 0 时才执行查询
  enabled: computed(() => userId.value > 0),
})
```

典型场景：**依赖查询** – 等某个查询有了结果，再发起下一个查询。

```typescript
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})

const { data: firstUserDetail } = useQuery({
  queryKey: ['user', 'detail'],
  queryFn: () => fetchUserDetail(users.value?.[0]?.id),
  // 只有当 users 数组存在且长度 > 0 时，才执行这个查询
  enabled: computed(() => !!users.value?.length),
})
```

### 4.2 `select` – 数据转换

```typescript
// 只返回未完成的待办事项
const { data: incompleteTodos } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (todos) => todos.filter(todo => !todo.completed),
})
```

`select` 函数的返回值会直接成为 `data`，并且这个转换是**响应式且可缓存的**。

### 4.3 `keepPreviousData` – 平滑分页

当分页参数变化时，新数据返回之前，页面会短暂显示空白，造成“闪屏”。`keepPreviousData: true` 可以**保留旧数据**，直到新数据到达。

```typescript
const { data, isFetching } = useQuery({
  queryKey: ['todos', page],
  queryFn: () => fetchTodosByPage(page.value),
  keepPreviousData: true,
})
```

此时你可以在 UI 上显示一个“加载更多”的小提示，而不是整个列表闪烁。

### 4.4 `staleTime` 与 `cacheTime` 的最佳实践

| 配置项       | 作用                           | 默认值 | 推荐值                 |
| ------------ | ------------------------------ | ------ | ---------------------- |
| `staleTime`  | 数据多久后变为“过时”           | 0      | 按业务定，如 5 分钟   |
| `cacheTime`  | 未使用数据保留在缓存中的时长   | 5 分钟 | 通常保持默认，或稍长  |

**经验法则**：  
- 对于极少变化的数据（如配置信息），`staleTime` 可设为 `Infinity`。  
- 对于实时性要求高的数据（如股票行情），`staleTime` 设为 0，并配合 `refetchInterval` 轮询。


## 五、数据变更：useMutation 入门

### 5.1 为什么不用 axios 直接 POST？

如果你直接用 axios 调用 POST，你还需要手动更新列表、处理加载状态、错误处理……而 TanStack Query 将这些**副作用**和**状态**统一管理起来。

### 5.2 基础用法：添加待办事项

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import axios from 'axios'

const queryClient = useQueryClient()

const addTodo = async (title: string) => {
  const response = await axios.post('/api/todos', { title, completed: false })
  return response.data
}

const {
  mutate,           // 调用此函数触发 mutation
  isPending,        // 是否正在提交
  isError,
  error,
} = useMutation({
  mutationFn: addTodo,
  // ❶ 请求成功后，让 ['todos'] 查询失效，列表自动重新获取
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})

const newTitle = ref('')

const handleSubmit = () => {
  if (newTitle.value.trim()) {
    mutate(newTitle.value)
    newTitle.value = ''
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="newTitle" placeholder="新待办" :disabled="isPending" />
    <button type="submit" :disabled="isPending">
      {{ isPending ? '添加中...' : '添加' }}
    </button>
    <p v-if="isError">添加失败：{{ error.message }}</p>
  </form>
</template>
```

**核心思想**：`mutation` 成功后，**我们不直接操作缓存，而是让对应的查询失效**（`invalidateQueries`）。TanStack Query 会自动重新请求，并将新数据写入缓存。这种模式叫做**“声明式缓存更新”**，简单、可靠、不易出错。

### 5.3 `mutate` 与 `mutateAsync`

- `mutate`：调用后立即返回，不等待结果。适合“触发后不关心具体返回值”的场景。
- `mutateAsync`：返回 Promise，可以用 `await` 等待结果，适合需要在成功后执行后续逻辑（如跳转）的场景。

```typescript
const { mutateAsync } = useMutation({ mutationFn: addTodo })

const handleAdd = async () => {
  try {
    const result = await mutateAsync('学习 TanStack Query')
    console.log('添加成功，ID:', result.id)
    // 跳转到详情页
    router.push(`/todos/${result.id}`)
  } catch (error) {
    console.error('添加失败', error)
  }
}
```


## 六、大杀器：乐观更新（Optimistic Update）

### 6.1 什么是乐观更新？

**悲观更新**：先发请求 → 等服务器返回成功 → 更新 UI。  
**乐观更新**：先发请求 → **立刻**更新 UI → 如果服务器返回失败，则回滚。

在网络延迟较高时，乐观更新能给用户“瞬间响应”的极致体验。TanStack Query 通过 `useMutation` 的三个回调，让乐观更新变得异常简单。

### 6.2 完整示例：切换待办事项完成状态（带乐观更新）

```vue
<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import axios from 'axios'

interface Todo {
  id: number
  title: string
  completed: boolean
}

const queryClient = useQueryClient()

// 查询：获取待办列表
const { data: todos } = useQuery({
  queryKey: ['todos'],
  queryFn: async () => {
    const res = await axios.get<Todo[]>('/api/todos')
    return res.data
  },
})

// 变更：切换完成状态（乐观更新版）
const { mutate: toggleTodo } = useMutation({
  mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
    await axios.patch(`/api/todos/${id}`, { completed })
    return { id, completed }
  },

  // ⚡ 1. onMutate：在 mutation 函数执行**之前**调用
  onMutate: async ({ id, completed }) => {
    // ① 取消任何正在进行的 ['todos'] 查询，避免它们覆盖我们的乐观更新
    await queryClient.cancelQueries({ queryKey: ['todos'] })

    // ② 获取当前缓存中的数据（快照）
    const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])

    // ③ 乐观更新：立即修改缓存
    queryClient.setQueryData<Todo[]>(['todos'], (old) => {
      if (!old) return []
      return old.map((todo) =>
        todo.id === id ? { ...todo, completed } : todo
      )
    })

    // ④ 返回上下文，供 onError 使用
    return { previousTodos }
  },

  // ❌ 2. onError：请求失败时调用
  onError: (error, variables, context) => {
    // 使用之前保存的快照，将缓存回滚到原来的状态
    if (context?.previousTodos) {
      queryClient.setQueryData(['todos'], context.previousTodos)
    }
    console.error('更新失败', error)
  },

  // ✅ 3. onSettled：请求完成后（无论成功/失败）调用
  onSettled: () => {
    // 可选：重新获取最新数据，确保与服务器完全一致
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
</script>

<template>
  <ul>
    <li v-for="todo in todos" :key="todo.id">
      <input
        type="checkbox"
        :checked="todo.completed"
        @change="toggleTodo({ id: todo.id, completed: !todo.completed })"
      />
      <span :class="{ completed: todo.completed }">{{ todo.title }}</span>
    </li>
  </ul>
</template>
```

**乐观更新的三个关键回调**：

| 回调        | 调用时机           | 典型职责                           |
| ----------- | ------------------ | ---------------------------------- |
| `onMutate`  | mutation 执行**前** | 取消冲突请求，保存快照，直接更新缓存 |
| `onError`   | mutation 失败时     | 用快照回滚缓存                   |
| `onSettled` | mutation 完成后     | 重新获取数据，清理状态           |

### 6.3 删除操作的乐观更新

删除时也可以使用同样的模式：

```typescript
const { mutate: deleteTodo } = useMutation({
  mutationFn: (id: number) => axios.delete(`/api/todos/${id}`),
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])
    // 直接从缓存中移除该项
    queryClient.setQueryData<Todo[]>(['todos'], (old) =>
      old?.filter((todo) => todo.id !== id) ?? []
    )
    return { previousTodos }
  },
  onError: (error, id, context) => {
    if (context?.previousTodos) {
      queryClient.setQueryData(['todos'], context.previousTodos)
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

### 6.4 添加操作的乐观更新（临时 ID）

添加操作比较特殊，因为新数据在服务器返回前没有真正的 `id`。我们可以生成一个**临时 ID**，并在成功后用服务器返回的真实数据替换它。

```typescript
const { mutate: addTodo } = useMutation({
  mutationFn: (title: string) =>
    axios.post('/api/todos', { title, completed: false }).then((res) => res.data),

  onMutate: async (title) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])

    // 生成临时 ID（例如时间戳）
    const tempId = Date.now()
    const optimisticTodo: Todo = {
      id: tempId,
      title,
      completed: false,
    }

    queryClient.setQueryData<Todo[]>(['todos'], (old) =>
      old ? [...old, optimisticTodo] : [optimisticTodo]
    )

    return { previousTodos, tempId }
  },

  onError: (error, title, context) => {
    if (context?.previousTodos) {
      queryClient.setQueryData(['todos'], context.previousTodos)
    }
  },

  onSuccess: (data, title, context) => {
    // 成功后将临时数据替换为真实数据
    queryClient.setQueryData<Todo[]>(['todos'], (old) =>
      old?.map((todo) =>
        todo.id === context?.tempId ? data : todo
      ) ?? []
    )
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```


## 七、高级实战场景

### 7.1 无限滚动 / 分页加载

`useInfiniteQuery` 专门为“加载更多”场景设计，自动拼接数据，并提供 `hasNextPage`、`fetchNextPage` 等状态。

```typescript
import { useInfiniteQuery } from '@tanstack/vue-query'

const fetchProjects = async ({ pageParam = 0 }) => {
  const res = await axios.get('/api/projects', { params: { cursor: pageParam } })
  return res.data
}

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  initialPageParam: 0,
})
```

模板中使用 `v-for` 遍历 `data.pages.flatMap(page => page.data)` 即可。

### 7.2 并行查询

如果需要在同一组件中并发执行多个独立的查询，可以使用 `useQueries`：

```typescript
import { useQueries } from '@tanstack/vue-query'

const results = useQueries({
  queries: [
    { queryKey: ['user', 1], queryFn: () => fetchUser(1) },
    { queryKey: ['user', 2], queryFn: () => fetchUser(2) },
    { queryKey: ['user', 3], queryFn: () => fetchUser(3) },
  ],
})
```

`results` 是一个数组，每个元素都是对应查询的状态对象。

### 7.3 依赖查询（串行）

我们已经在前文用 `enabled` 实现过，这里再给出一个 TypeScript 最佳实践：

```typescript
const { data: userIds } = useQuery({
  queryKey: ['userIds'],
  queryFn: fetchUserIds,
})

const selectedUserId = ref(1)

const { data: userDetails } = useQuery({
  queryKey: ['user', selectedUserId],
  queryFn: () => fetchUser(selectedUserId.value),
  enabled: computed(() => !!selectedUserId.value),
})
```

### 7.4 轮询（实时数据）

```typescript
const { data } = useQuery({
  queryKey: ['liveData'],
  queryFn: fetchLiveData,
  refetchInterval: 5000, // 每 5 秒自动重新请求
})
```


## 八、为什么你应该彻底拥抱 TanStack Query

| 场景                       | 只用 axios                                      | 使用 TanStack Query                                  |
| -------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| **重复请求**               | 多个组件各自发请求，浪费带宽                   | 自动去重，同一查询键只发一次请求                     |
| **缓存管理**               | 需要手动写 localStorage 或 Map，还要处理过期    | 内置内存缓存，自动过期，配置简单                     |
| **加载/错误状态**          | 每个组件都要定义一堆 ref，try-catch 写到手软   | 一个 useQuery 返回所有状态，零模板代码               |
| **分页/无限滚动**          | 手动拼接数据，维护页码，处理竞态               | useInfiniteQuery 一行搞定                            |
| **后台数据刷新**           | 自己监听 window 事件，容易写错                 | refetchOnWindowFocus / refetchOnReconnect 开箱即用 |
| **乐观更新**               | 几乎不可能实现，或者代码极其复杂               | 三个回调函数，清晰优雅                               |
| **请求失败重试**           | 自己写递归或循环，容易死循环                   | retry 配置项，智能指数退避                          |
| **查询依赖**               | 在 watch 里手动调用，管理竞态很头疼            | 用 enabled 和 queryKey 联动，自动处理               |
| **开发工具**               | 需要自己写日志，或者用浏览器网络面板           | 官方 Devtools，可视化缓存、查询状态                 |



**进一步学习资源**：
- [官方文档（Vue）](https://tanstack.com/query/latest/docs/framework/vue/overview)
- [TanStack Query Devtools](https://tanstack.com/query/latest/docs/framework/vue/devtools) – 强烈推荐安装，调试神器。
