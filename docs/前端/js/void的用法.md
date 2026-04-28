# void 的用法（JS/TS 笔记）

## 核心身份
`void` 有两种用法：
1. **JS 运算符**：执行表达式后始终返回 `undefined`
2. **TS 类型**：标记函数无业务返回值

---

## 一、JS 里的 void 运算符
### 基本规则
`void 表达式` → 执行表达式 → 丢弃结果 → 返回 `undefined`
```javascript
void 1; // undefined
void (2 + 3); // undefined

function fn() { return 'done'; }
void fn(); // undefined（fn的返回值被丢弃）
```

### 历史写法（了解即可）
| 写法 | 用途 | 现状 |
|------|------|------|
| `void 0` | 稳定生成 undefined | 现代代码直接写 `undefined` 即可 |
| `<a href="javascript:void(0)">` | 阻止链接跳转 | 不推荐，改用 `<button>` 或 `event.preventDefault()` |

---

## 二、TS 里的 void 类型
标记函数只做副作用操作（日志、改状态、发请求），无返回值：
```typescript
function updateTitle(title: string): void {
  document.title = title;
}

type ClickHandler = () => void; // 事件回调常用
```

⚠️ 注意：`(): void` 是类型，`void fn()` 是 JS 运算符，二者无关。

---

## 三、前端最常用场景：void 异步函数
### 典型用法
```typescript
async function handleSubmit() {
  await saveData();
  await reportAnalytics();
}

// 触发异步逻辑，但当前不等待结果
void handleSubmit();
```

### 为什么这么写？
1. **明确意图**：告诉读者/团队成员：我是故意不接这个 Promise，不是漏写 `await`
2. **过 ESLint**：很多项目开 `no-floating-promises` 规则，直接调用 `handleSubmit()` 会报警告，`void` 可显式标记忽略
3. **适合事件回调**：
```tsx
// React 事件
const onClick = () => { void handleSubmit(); }

// 原生 DOM
button.addEventListener('click', () => { void handleSubmit(); });

// useEffect（不能写 async 回调）
useEffect(() => { void loadData(); }, []);
```

---

## 四、注意事项
❌ **void 不处理错误**：它只忽略返回值，不会捕获异常
```typescript
// 错误示例：内部报错会导致未捕获的 Promise 错误
const onFinish = () => { void handleSubmit(); }

// 正确写法1：函数内部 catch
async function handleSubmit() {
  try { await saveData(); } catch (e) { console.error(e); }
}

// 正确写法2：调用处补 catch
const onFinish = () => {
  void handleSubmit().catch(e => console.error(e));
}
```

---

## 五、什么时候用/不用
✅ **适合用**：
- 事件回调触发异步逻辑，不需要 await 结果
- useEffect/生命周期里启动异步任务
- 需要显式标记忽略 Promise（配合 ESLint）

❌ **不适合用**：
- 需要拿函数返回结果的时候
- 需要等待执行完成的时候
- 想靠它“压掉”错误提示的时候

---

## 快速区分
```typescript
function a(): void {}       // TS：函数 a 无返回值
void a();                   // JS：调用 a，主动忽略它的返回值
async function a(): Promise<void> {} // TS：异步函数，返回 Promise，但无业务返回值
```
