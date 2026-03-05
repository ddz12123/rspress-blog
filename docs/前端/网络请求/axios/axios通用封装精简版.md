# Axios 通用封装精简版

## 代码（可直接用）

```ts title="src/utils/request.ts"
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios'

/** 后端统一响应结构（按项目实际调整） */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 只保留一个扩展字段：是否跳过 token */
export interface RequestConfig extends AxiosRequestConfig {
  ignoreToken?: boolean
}

const TOKEN_KEY = 'token'
const SUCCESS_CODES = new Set([0, 200])

const HTTP_ERROR_MAP: Record<number, string> = {
  400: '请求参数错误',
  401: '登录状态已失效',
  403: '无权限访问',
  404: '请求资源不存在',
  409: '请求冲突',
  422: '参数校验失败',
  429: '请求过于频繁',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时',
}

const isApiResponse = (data: unknown): data is ApiResponse => {
  return (
    !!data &&
    typeof data === 'object' &&
    'code' in data &&
    'message' in data &&
    'data' in data
  )
}

export const getToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)

export const setToken = (token: string, remember = false): void => {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
  }
}

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
})

request.interceptors.request.use((config: InternalAxiosRequestConfig & RequestConfig) => {
  if (!config.ignoreToken) {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

request.interceptors.response.use(
  (response) => {
    // 文件流等场景直接透传
    if (
      response.config.responseType === 'blob' ||
      response.config.responseType === 'arraybuffer'
    ) {
      return response.data
    }

    const data = response.data

    // 非统一响应结构，直接透传（兼容第三方接口）
    if (!isApiResponse(data)) return data

    // 统一成功：只返回 data，业务层更干净
    if (SUCCESS_CODES.has(data.code)) return data.data

    if (data.code === 401) clearToken()
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  (error: AxiosError) => {
    const status = error.response?.status
    const message = status
      ? HTTP_ERROR_MAP[status] || `请求失败（${status}）`
      : error.code === 'ECONNABORTED'
        ? '请求超时，请稍后再试'
        : '网络异常，请检查网络连接'

    return Promise.reject(new Error(message))
  },
)

export const http = {
  request<T = unknown>(config: RequestConfig) {
    return request.request<unknown, T>(config)
  },
  get<T = unknown>(url: string, params?: Record<string, unknown>, config?: RequestConfig) {
    return request.get<unknown, T>(url, { ...config, params })
  },
  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig) {
    return request.post<unknown, T>(url, data, config)
  },
  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig) {
    return request.put<unknown, T>(url, data, config)
  },
  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig) {
    return request.patch<unknown, T>(url, data, config)
  },
  delete<T = unknown>(url: string, params?: Record<string, unknown>, config?: RequestConfig) {
    return request.delete<unknown, T>(url, { ...config, params })
  },
}
```

---

## 最小使用示例

```ts title="src/api/user.ts"
import { http } from '@/utils/request'

type UserInfo = { id: string; name: string }

export const getUserInfo = () => http.get<UserInfo>('/user/info')

export const login = (username: string, password: string) =>
  http.post<{ token: string }>(
    '/auth/login',
    { username, password },
    { ignoreToken: true },
  )
```
