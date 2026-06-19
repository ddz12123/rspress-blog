# TypeScript 高级用法

基于基础知识之上的进阶类型体操，覆盖实际项目中最常用的高级模式。

## 条件类型

语法跟三元表达式一样：`T extends U ? X : Y`，意思是"如果 T 能赋值给 U，就是 X，否则就是 Y"。

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false
```

### 分布式条件类型

当 `T` 是联合类型时，TS 会把每个成员分别代入计算，最后再联合起来。

```ts
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<string | number>;
// 等价于 ToArray<string> | ToArray<number>
// 即 string[] | number[]
```

:::warning
有时候不想分发（比如想得到 `(string | number)[]`），用 `[]` 包裹左侧就能阻止分发：
:::

```ts
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type Result2 = ToArrayNonDist<string | number>; // (string | number)[]
```

## infer

`infer` 用在条件类型的 `extends` 子句里，意思是"我先不指定这个位置是什么类型，让 TS 自己推断出来，推断结果赋值给这个变量"。

可以理解为类型层面的解构提取。

### 提取函数返回值

`infer R` 放在返回值位置，就能把函数的返回值类型提取出来：

```ts
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type R1 = MyReturnType<() => string>; // string
type R2 = MyReturnType<(x: number) => boolean>; // boolean
```

### 提取函数参数

`infer P` 放在参数位置，提取参数元组：

```ts
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;

type P1 = MyParameters<(a: string, b: number) => void>; // [a: string, b: number]
```

### 提取数组元素类型

匹配 `(infer E)[]` 这个模式，E 就是数组每个元素的类型：

```ts
type ElementOf<T> = T extends (infer E)[] ? E : never;

type Item = ElementOf<[string, number, boolean]>; // string | number | boolean
```

### 提取 Promise 内部类型

嵌套 Promise 可以递归提取，直到拿到最内层的值：

```ts
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type R = Awaited<Promise<Promise<string>>>; // string
```

### 提取模板字面量某部分

`infer` 也能用在模板字面量类型里，提取字符串的某一段：

```ts
type ExtractRoute<T> = T extends `/${infer Part}/${string}` ? Part : never;

type R = ExtractRoute<'/api/users/123'>; // 'api'
```

## 映射类型

语法 `[K in keyof T]: ...`，意思是"遍历 T 的所有 key，对每个 key 生成一个新的属性"。类似 JS 里的 `Object.map`。

内置的 `Partial`、`Readonly` 就是映射类型实现的：

```ts
type OptionalAll<T> = {
  [K in keyof T]?: T[K]; // 遍历每个 key，加上 ?
};

type ReadonlyAll<T> = {
  readonly [K in keyof T]: T[K]; // 遍历每个 key，加上 readonly
};
```

### 键重映射（as）

TS 4.1 引入，可以在遍历时用 `as` 改 key 的名字。语法：`[K in keyof T as 新名字]: ...`

比如把 `{ id, name }` 转成 `{ getId, getName }`：

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface User {
  id: number;
  name: string;
}

type UserGetters = Getters<User>;
// { getId: () => number; getName: () => string }
```

### 过滤键

`as` 后面写 `never` 就能过滤掉不要的 key：

```ts
type FilterByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

interface Props {
  id: number;
  name: string;
  visible: boolean;
  active: boolean;
}

type BooleanProps = FilterByType<Props, boolean>;
// { visible: boolean; active: boolean }
```

## 模板字面量类型

用反引号 `` `${}` `` 拼接字符串字面量类型，跟 JS 模板字符串语法一样。联合类型会做笛卡尔积。

### 基本用法

```ts
type Color = 'red' | 'blue';
type Size = 'sm' | 'lg';

type ClassName = `${Color}-${Size}`;
// 'red-sm' | 'red-lg' | 'blue-sm' | 'blue-lg'
```

### CSS 属性生成

```ts
type Margin = `margin-${'top' | 'right' | 'bottom' | 'left'}`;
// 'margin-top' | 'margin-right' | 'margin-bottom' | 'margin-left'
```

### 配合内置字符串工具

TS 内置了四个字符串工具类型：`Uppercase`、`Lowercase`、`Capitalize`、`Uncapitalize`。

```ts
type EventName = 'click' | 'change' | 'submit';

// Capitalize 把首字母大写
type HandlerName = `on${Capitalize<EventName>}`;
// 'onClick' | 'onChange' | 'onSubmit'

type Upper = Uppercase<'hello'>;     // 'HELLO'
type Lower = Lowercase<'HELLO'>;     // 'hello'
type Cap = Capitalize<'hello'>;      // 'Hello'
type Uncap = Uncapitalize<'Hello'>;  // 'hello'
```

### 事件类型推导

组合映射类型 + 模板字面量，可以自动生成事件处理器类型：

```ts
type DOMEvents = {
  click: MouseEvent;
  change: Event;
  submit: Event;
};

type EventHandler<K extends keyof DOMEvents> = (e: DOMEvents[K]) => void;

type Handlers = {
  [K in keyof DOMEvents as `on${Capitalize<K>}`]: EventHandler<K>;
};
// { onClick: (e: MouseEvent) => void; onChange: (e: Event) => void; onSubmit: (e: Event) => void }
```

## 类型体操常用工具

### Exclude / Extract

`Exclude<T, U>` 从联合类型 T 中排除可以赋值给 U 的成员。`Extract<T, U>` 则是提取。

底层就是分布式条件类型：

```ts
type T0 = Exclude<'a' | 'b' | 'c', 'a'>; // 'b' | 'c'
type T1 = Extract<'a' | 'b' | 'c', 'a' | 'f'>; // 'a'
```

### NonNullable

排除 `null` 和 `undefined`：

```ts
type T2 = NonNullable<string | null | undefined>; // string
```

### Awaited

递归解包 Promise，TS 4.5+ 内置：

```ts
type T3 = Awaited<Promise<Promise<Promise<string>>>>; // string
```

### InstanceType

从 class 构造函数提取实例类型：

```ts
class User {
  id = 1;
  name = '';
}

type UserInstance = InstanceType<typeof User>; // User
```

### ConstructorParameters

提取 class 构造函数的参数类型元组：

```ts
class User {
  constructor(
    public id: number,
    public name: string,
  ) {}
}

type CP = ConstructorParameters<typeof User>; // [id: number, name: string]
```

## 品牌类型（Branded Types）

TS 的结构类型系统下，`number` 和 `number` 是同一个类型，没法区分美元和人民币。品牌类型通过交叉一个不存在的属性来"打标签"，运行时没有开销，但编译时能区分开。

```ts
type USD = number & { readonly __brand: 'USD' };
type CNY = number & { readonly __brand: 'CNY' };

function createUSD(amount: number): USD {
  return amount as USD;
}

function createCNY(amount: number): CNY {
  return amount as CNY;
}

function pay(usd: USD) {
  // 只接受 USD
}

const price = createUSD(100);
const rmb = createCNY(100);

pay(price); // ✅
// pay(rmb); // ❌ 类型不兼容，CNY 不能赋值给 USD
```

## 可辨识联合（Discriminated Union）

也叫标签联合（Tagged Union）。给每个 interface 加一个相同的字面量字段（如 `kind`、`type`、`status`），然后用 `switch` 或 `if` 缩窄类型，TS 会自动推导出具体是哪个 interface。

```ts
interface Circle {
  kind: 'circle';    // 共同的辨识字段
  radius: number;
}

interface Rectangle {
  kind: 'rectangle';
  width: number;
  height: number;
}

interface Triangle {
  kind: 'triangle';
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;   // TS 知道这里是 Circle
    case 'rectangle':
      return shape.width * shape.height;     // TS 知道这里是 Rectangle
    case 'triangle':
      return (shape.base * shape.height) / 2; // TS 知道这里是 Triangle
  }
}
```

配合 `never` 做穷尽检查 — 如果新增了类型但忘了处理，编译时就会报错：

```ts
function assertNever(x: never): never {
  throw new Error(`Unexpected: ${x}`);
}

function areaSafe(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
    default:
      return assertNever(shape); // 所有分支都处理了就不会走到这
  }
}
```

## 函数重载

写多个函数签名（不带函数体），最后一个签名是具体实现。调用时 TS 会匹配最合适的签名来推断返回类型。

```ts
function createElement(tag: 'img'): HTMLImageElement;
function createElement(tag: 'video'): HTMLVideoElement;
function createElement(tag: 'canvas'): HTMLCanvasElement;
function createElement(tag: string): HTMLElement;   // 兜底签名
function createElement(tag: string): HTMLElement {  // 实现
  return document.createElement(tag);
}

const img = createElement('img'); // HTMLImageElement
const div = createElement('div'); // HTMLElement（走兜底签名）
```

## 递归类型

类型可以引用自身，实现深度嵌套的类型转换。

### 深度 Partial

内置的 `Partial` 只处理一层，嵌套对象还是必填的。递归版可以一路打到底：

```ts
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

interface Config {
  api: {
    baseURL: string;
    timeout: number;
  };
  theme: {
    color: string;
    fontSize: number;
  };
}

type PartialConfig = DeepPartial<Config>;
// api 和 theme 内部的属性也变成可选了
```

### 深度 Readonly

```ts
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
```

### 深度 Required

`-?` 的意思是移除可选标记：

```ts
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K];
};
```

### Tuple 转 Union

`T[number]` 是取元组所有索引的联合：

```ts
type TupleToUnion<T extends any[]> = T[number];

type U = TupleToUnion<[string, number, boolean]>; // string | number | boolean
```

## 类型安全的事件发射器

用泛型约束事件名和 payload 的对应关系，传错事件名或 payload 结构编译时就报错：

```ts
type EventMap = {
  login: { userId: string; timestamp: number };
  logout: { userId: string };
  error: { code: number; message: string };
};

class TypedEmitter<T extends Record<string, any>> {
  private handlers = new Map<string, Function[]>();

  on<K extends keyof T>(event: K, handler: (payload: T[K]) => void) {
    const list = this.handlers.get(event as string) ?? [];
    list.push(handler);
    this.handlers.set(event as string, list);
  }

  emit<K extends keyof T>(event: K, payload: T[K]) {
    this.handlers.get(event as string)?.forEach((fn) => fn(payload));
  }
}

const emitter = new TypedEmitter<EventMap>();

emitter.on('login', (data) => {
  console.log(data.userId); // ✅ data 自动推导为 { userId: string; timestamp: number }
});

// emitter.emit('login', { userId: '1' }); // ❌ 缺少 timestamp
```

## 类型安全的 Builder 模式

每次 `.set()` 都返回一个新的 Builder 类型，累积记录已设置的字段。最终 `.build()` 时类型完整：

```ts
class Builder<T extends Record<string, any> = {}> {
  private data: Partial<T> = {};

  set<K extends string, V>(
    key: K,
    value: V,
  ): Builder<T & Record<K, V>> {
    (this.data as any)[key] = value;
    return this as any;
  }

  build(): T {
    return this.data as T;
  }
}

const user = new Builder()
  .set('name', 'Tom')
  .set('age', 18)
  .set('email', 'tom@example.com')
  .build();

// user 的类型是 { name: string } & { age: number } & { email: string }
```

## const 类型参数

TS 5.0 引入。泛型参数加 `const` 修饰后，TS 会推断为最窄的字面量类型，而不是宽泛的基础类型。

不加 `const`，`['home', 'about']` 会被推断为 `string[]`；加了之后推断为 `readonly ['home', 'about']`：

```ts
function routes<const T extends readonly string[]>(paths: T): T {
  return paths;
}

const r = routes(['home', 'about', 'user']);
// 类型是 readonly ['home', 'about', 'user']

// 对比不加 const：
function routesOld<T extends readonly string[]>(paths: T): T {
  return paths;
}
const r2 = routesOld(['home', 'about', 'user']);
// 类型是 readonly string[] — 丢失了具体值
```

## satisfies 操作符

TS 4.9 引入。`satisfies` 的意思是"校验这个值符合某个类型，但不要改变它的推断结果"。

对比 `: Type`（冒号标注）的问题：冒号会把类型拓宽。比如 `const x: string = 'hello'`，x 的类型是 `string` 而不是 `'hello'`。

`satisfies` 解决这个问题 — 既校验结构正确，又保留字面量推断：

```ts
type Theme = {
  primary: string;
  background: string;
};

// 冒号的问题：类型被拓宽
const theme1: Theme = {
  primary: '#1890ff',
  background: '#fff',
};
// theme1.primary 类型是 string

// satisfies：校验 + 保留
const theme2 = {
  primary: '#1890ff',
  background: '#fff',
} satisfies Theme;
// theme2.primary 类型是 '#1890ff'（字面量保留了）
```

实际场景 — 常量对象的精确类型：

```ts
const routes = {
  home: '/',
  about: '/about',
  user: '/user/:id',
} satisfies Record<string, string>;

// 既能保证所有值都是 string，又保留了具体结构
routes.home; // ✅
// routes.notExist; // ❌ 属性不存在
```

## 常见实战模式

### API 响应类型封装

用可辨识联合区分成功和失败，配合自定义类型守卫安全取值：

```ts
interface ApiOk<T> {
  code: 0;       // 字面量 0，只匹配成功
  data: T;
}

interface ApiErr {
  code: number;  // 宽泛的 number，匹配失败
  message: string;
}

type ApiResult<T> = ApiOk<T> | ApiErr;

// 自定义类型守卫：返回值是 result is ApiOk<T>
function isOk<T>(result: ApiResult<T>): result is ApiOk<T> {
  return result.code === 0;
}

async function fetchUser(): Promise<ApiResult<{ id: number; name: string }>> {
  const res = await fetch('/api/user');
  return res.json();
}

const result = await fetchUser();

if (isOk(result)) {
  result.data.id; // ✅ TS 知道这里一定是 ApiOk
} else {
  result.message; // ✅ TS 知道这里一定是 ApiErr
}
```

### 路由参数提取

用递归 + `infer` 从路径字符串里提取参数名：

```ts
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractParams<Rest>]: string }
    : T extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {};

type P1 = ExtractParams<'/user/:id'>;              // { id: string }
type P2 = ExtractParams<'/user/:id/post/:postId'>; // { id: string; postId: string }
type P3 = ExtractParams<'/about'>;                  // {}
```

### 状态机类型

用映射类型定义每个状态能转移到哪些状态，非法转移编译时就报错：

```ts
type State = 'idle' | 'loading' | 'success' | 'error';

type Transition = {
  idle: 'loading';
  loading: 'success' | 'error';
  success: 'idle' | 'loading';
  error: 'idle' | 'loading';
};

function transition<S extends State>(state: S, action: Transition[S]): Transition[S] {
  // 实际逻辑...
  return action;
}

transition('idle', 'loading'); // ✅
// transition('idle', 'error'); // ❌ idle 只能转到 loading
```

### 类型安全的 Object.keys

原生 `Object.keys` 返回 `string[]`，丢失了 key 信息。封装一个泛型版本：

```ts
function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

const config = { host: 'localhost', port: 3000, debug: true };

typedKeys(config).forEach((key) => {
  console.log(key);       // 'host' | 'port' | 'debug'
  console.log(config[key]); // 类型安全取值
});
```
