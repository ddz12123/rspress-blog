# TypeScript 主要知识点

## 基础类型

```ts
let username: string = 'Tom';
let age: number = 18;
let isLogin: boolean = true;
let empty: null = null;
let notFound: undefined = undefined;
let id: symbol = Symbol('id');
let bigNumber: bigint = 100n;
```

数组：

```ts
const ids: number[] = [1, 2, 3];
const names: Array<string> = ['Tom', 'Jack'];
```

对象：

```ts
const user: { id: number; name: string } = {
  id: 1,
  name: 'Tom',
};
```

## 类型推断

简单变量可以不写类型，TS 会自动推断。

```ts
let count = 1;

count = 2;
// count = '2'; // 报错
```

函数参数建议写类型，返回值多数时候可以让 TS 推断。

```ts
function add(a: number, b: number) {
  return a + b;
}
```

## 联合类型

一个值允许是多种类型。

```ts
let id: string | number;

id = 'user-001';
id = 1001;
```

使用前需要缩小类型范围：

```ts
function format(value: string | number) {
  if (typeof value === 'string') {
    return value.trim();
  }

  return value.toFixed(2);
}
```

## 字面量类型

限制值只能是固定选项。

```ts
type Theme = 'light' | 'dark';
type Status = 'idle' | 'loading' | 'success' | 'error';

const statusText: Record<Status, string> = {
  idle: '未开始',
  loading: '加载中',
  success: '成功',
  error: '失败',
};
```

## type 和 interface

### interface

适合描述对象结构。

```ts
interface User {
  readonly id: number;
  name: string;
  age?: number;
}

const user: User = {
  id: 1,
  name: 'Tom',
};
```

### type

适合类型别名、联合类型、工具类型组合。

```ts
type ID = string | number;
type Theme = 'light' | 'dark';

type User = {
  id: ID;
  name: string;
};
```

### 交叉类型

```ts
type Base = {
  id: number;
};

type User = Base & {
  name: string;
};
```

## 函数类型

```ts
function add(a: number, b: number): number {
  return a + b;
}

const minus = (a: number, b: number): number => a - b;
```

函数类型别名：

```ts
type AddFn = (a: number, b: number) => number;

const add: AddFn = (a, b) => a + b;
```

可选参数和默认参数：

```ts
function createUser(name: string, age?: number) {
  return { name, age };
}

function request(url: string, method: 'GET' | 'POST' = 'GET') {
  return `${method} ${url}`;
}
```

## 泛型

泛型用来保留输入和输出之间的类型关系。

```ts
function identity<T>(value: T): T {
  return value;
}

const username = identity('Tom');
const age = identity(18);
```

请求封装常用写法：

```ts
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface User {
  id: number;
  name: string;
}

async function request<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  return res.json();
}

const userRes = await request<User>('/api/user');

userRes.data.id;
userRes.data.name;
```

泛型约束：

```ts
function getLength<T extends { length: number }>(value: T) {
  return value.length;
}

getLength('abc');
getLength([1, 2, 3]);
```

## 类型断言

告诉 TS 按指定类型处理。

```ts
const input = document.querySelector('#username') as HTMLInputElement;

input.value = 'Tom';
```

:::warning
类型断言不做运行时校验，只影响类型检查。
:::

## 类型守卫

### typeof

```ts
function format(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }

  return value.toFixed(2);
}
```

### in

```ts
interface Admin {
  role: 'admin';
  permissions: string[];
}

interface Guest {
  role: 'guest';
  expiredAt: string;
}

function getInfo(user: Admin | Guest) {
  if ('permissions' in user) {
    return user.permissions;
  }

  return user.expiredAt;
}
```

### 自定义守卫

```ts
interface User {
  id: number;
  name: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}
```

## any、unknown、never

### any

关闭类型检查，尽量少用。

```ts
let value: any = 1;

value.foo.bar();
```

### unknown

未知类型，比 `any` 安全，使用前必须缩小类型。

```ts
let value: unknown = 'hello';

if (typeof value === 'string') {
  value.toUpperCase();
}
```

### never

永远不会出现的类型，常用于穷尽检查。

```ts
type Status = 'success' | 'error';

function handleStatus(status: Status) {
  switch (status) {
    case 'success':
      return '成功';
    case 'error':
      return '失败';
    default: {
      const exhaustiveCheck: never = status;
      return exhaustiveCheck;
    }
  }
}
```

## enum

```ts
enum RequestMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE',
}
```

如果只是限制字符串，联合类型更轻：

```ts
type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
```

## class

```ts
class UserService {
  public name = 'user-service';
  private token = '';
  protected baseURL = '/api';

  setToken(token: string) {
    this.token = token;
  }
}
```

- `public`：默认值，外部可访问
- `private`：只能当前类访问
- `protected`：当前类和子类可访问

构造函数参数属性：

```ts
class User {
  constructor(
    public id: number,
    public name: string,
  ) {}
}
```

## 工具类型

### Partial

全部变可选。

```ts
interface User {
  id: number;
  name: string;
  age: number;
}

type PartialUser = Partial<User>;
```

### Required

全部变必填。

```ts
type RequiredUser = Required<PartialUser>;
```

### Pick

挑选字段。

```ts
type UserBaseInfo = Pick<User, 'id' | 'name'>;
```

### Omit

排除字段。

```ts
type CreateUserPayload = Omit<User, 'id'>;
```

### Record

定义对象 key 和 value 类型。

```ts
type Role = 'admin' | 'user' | 'guest';

const roleMap: Record<Role, string> = {
  admin: '管理员',
  user: '用户',
  guest: '游客',
};
```

### ReturnType

获取函数返回值类型。

```ts
function getUser() {
  return {
    id: 1,
    name: 'Tom',
  };
}

type User = ReturnType<typeof getUser>;
```

### Parameters

获取函数参数类型。

```ts
function queryUser(id: number, keyword: string) {
  return { id, keyword };
}

type QueryUserParams = Parameters<typeof queryUser>; // [number, string]
```

## keyof、typeof、as const

### keyof

获取对象类型的 key。

```ts
interface User {
  id: number;
  name: string;
  age: number;
}

type UserKey = keyof User; // 'id' | 'name' | 'age'
```

配合泛型取值：

```ts
function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: 'Tom' };

const name = getValue(user, 'name');
```

### typeof

从变量提取类型。

```ts
const user = {
  id: 1,
  name: 'Tom',
};

type User = typeof user;
```

### as const

保留字面量类型。

```ts
const routes = ['home', 'about', 'user'] as const;

type RouteName = (typeof routes)[number]; // 'home' | 'about' | 'user'
```

## d.ts 声明文件

声明静态资源：

```ts
declare module '*.png' {
  const src: string;
  export default src;
}
```

声明全局变量：

```ts
declare const APP_VERSION: string;
```

声明环境变量：

```ts
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## tsconfig 常用配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "skipLibCheck": true
  }
}
```

| 配置 | 说明 |
| --- | --- |
| `target` | 编译目标版本 |
| `module` | 模块规范 |
| `moduleResolution` | 模块解析策略 |
| `strict` | 严格模式 |
| `jsx` | JSX 编译方式 |
| `baseUrl` | 路径基础目录 |
| `paths` | 路径别名 |
| `skipLibCheck` | 跳过第三方类型检查 |

## Vue 常用类型写法

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
});

const emit = defineEmits<{
  change: [value: number];
  submit: [id: string];
}>();
</script>
```

```ts
import { computed, ref } from 'vue';

interface User {
  id: number;
  name: string;
}

const user = ref<User | null>(null);
const username = computed(() => user.value?.name ?? '未登录');
```

## React 常用类型写法

```tsx
interface ButtonProps {
  type?: 'primary' | 'default';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

function Button(props: ButtonProps) {
  const { type = 'default', disabled = false, onClick, children } = props;

  return (
    <button className={`btn btn-${type}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
```

事件类型：

```tsx
function SearchInput() {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.value);
  };

  return <input onChange={handleChange} />;
}
```

`useState`：

```tsx
interface User {
  id: number;
  name: string;
}

const [user, setUser] = useState<User | null>(null);
```

