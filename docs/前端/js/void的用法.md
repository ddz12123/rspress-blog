# void 的用法

`void` 在前端里不算高频语法,但你一定见过它。  
比如老项目里的 `javascript:void(0)`、TypeScript 里的 `(): void`、以及现在更常见的 `void handleGameCompletion()`。

很多人第一次看到 `void handleGameCompletion()` 会疑惑:为什么函数前面要加一个 `void`?  
这篇文章就专门把前端里常见的 `void` 用法讲清楚。

## 什么是 void

`void` 有两种常见身份:

1. **在 JavaScript 里,它是一个运算符**
2. **在 TypeScript 里,它经常作为返回值类型使用**

这两种写法长得一样,但含义不完全相同。

---

## 1. JavaScript 里的 `void` 运算符

### 基本作用

`void 表达式` 会先执行这个表达式,然后**始终返回 `undefined`**。

```javascript
console.log(void 1); // undefined
console.log(void (2 + 3)); // undefined
```

重点有两个:

- 表达式会执行
- 执行结果会被丢弃,最终得到 `undefined`

例如:

```javascript
function logMessage() {
  console.log('执行了');
  return 'done';
}

const result = void logMessage();

console.log(result); // undefined
```

虽然 `logMessage()` 返回了 `'done'`,但前面加了 `void` 之后,最终结果还是 `undefined`。

### `void 0`

你可能还见过这种写法:

```javascript
console.log(void 0); // undefined
```

它本质上就是“稳定地产生一个 `undefined`”。  
在现代代码里直接写 `undefined` 就够了,所以 `void 0` 现在更多是历史写法或个人习惯。

### `javascript:void(0)`

这是前端里最经典的一种旧写法:

```html
<a href="javascript:void(0)">点击</a>
```

它的目的通常是:

- 点击链接时不跳转
- 不返回任何有意义的值

但在现代前端里,**这类写法并不推荐**。更好的方式是:

```html
<button type="button">点击</button>
```

或者在事件里显式阻止默认行为:

```javascript
link.addEventListener('click', (event) => {
  event.preventDefault();
});
```

原因很简单:

- 可读性更差
- 不够语义化
- 对可访问性不友好

---

## 2. TypeScript 里的 `void`

在 TypeScript 中,`void` 最常见的意思是: **这个函数不关心返回值**。

```typescript
function reportGameStatus(): void {
  console.log('游戏已结束');
}
```

这里的 `void` 表示这个函数设计上就是做副作用操作,比如:

- 打印日志
- 修改状态
- 发送请求
- 触发通知

而不是返回一个需要继续参与计算的值。

### 常见场景

```typescript
function updateTitle(title: string): void {
  document.title = title;
}
```

```typescript
type ClickHandler = () => void;
```

很多事件处理函数都会写成 `() => void`,因为点击事件通常关注的是“做什么”,而不是“返回什么”。

需要注意的是,TypeScript 里的 `void` 和 JavaScript 里的 `void` 运算符不是一回事:

- `(): void` 是**类型**
- `void fn()` 是**表达式运算**

---

## 3. 前端里最常见的写法: `void handleGameCompletion()`

这是这篇文章最值得关注的部分。

先看一个例子:

```typescript
async function handleGameCompletion() {
  await saveScore();
  await sendAnalytics();
  console.log('游戏结算完成');
}
```

因为它是 `async` 函数,所以它的返回值其实是:

```typescript
Promise<void>
```

也就是说,下面这句代码:

```typescript
handleGameCompletion();
```

实际上会返回一个 `Promise`。  
如果你只是想“触发一下这个异步逻辑”,并不打算在当前地方 `await` 它,就经常会写成:

```typescript
void handleGameCompletion();
```

### 这行代码到底是什么意思

它表达的是:

- 我知道这个函数会返回一个 `Promise`
- 但我这里就是**故意不处理这个返回值**
- 我只关心它被执行,不关心它返回什么

这是一种非常明确的“主动忽略返回值”的写法。

### 为什么前端里经常这样写

#### 1. 明确告诉别人: 这个 Promise 是故意不接的

```typescript
const onFinish = () => {
  void handleGameCompletion();
};
```

比起直接写 `handleGameCompletion();`,`void` 会让意图更明确。  
别人一看就知道:这里不是漏写了 `await`,而是刻意不等它。

#### 2. 配合 ESLint 规则

很多项目会开启类似 `no-floating-promises` 的规则,不允许随手丢一个未处理的 Promise:

```typescript
handleGameCompletion(); // 可能触发 lint 警告
void handleGameCompletion(); // 明确表示有意忽略
```

所以 `void` 在很多团队里其实是一种“代码态度声明”。

#### 3. 很适合事件回调

比如 React、Vue、原生 DOM 事件里,回调函数通常不需要返回 Promise 给外层:

```tsx
const onClick = () => {
  void handleGameCompletion();
};

return <button onClick={onClick}>结束游戏</button>;
```

或者:

```typescript
button.addEventListener('click', () => {
  void handleGameCompletion();
});
```

这种场景很常见:

- 点击按钮后上报数据
- 提交表单后异步保存
- 页面加载后拉取数据
- 游戏结束后结算并埋点

### 在 React `useEffect` 里也很常见

```tsx
useEffect(() => {
  void loadGameData();
}, []);
```

原因也一样: `useEffect` 的回调本身不应该直接写成 `async`,于是常见做法就是在内部调用异步函数,并用 `void` 明确忽略返回值。

---

## 4. `void handleGameCompletion()` 不等于“处理了错误”

这是最容易误解的一点。

`void` 只是**忽略返回值**,它**不会自动帮你捕获异常**。

如果 `handleGameCompletion()` 内部抛错,而你又没有处理,依然可能出现未处理的 Promise 错误。

错误示例:

```typescript
const onFinish = () => {
  void handleGameCompletion();
};
```

如果 `handleGameCompletion` 内部失败了,这里并不会因为有 `void` 就安全。

更稳妥的写法有两种。

### 写法 1: 在异步函数内部处理错误

```typescript
async function handleGameCompletion() {
  try {
    await saveScore();
    await sendAnalytics();
  } catch (error) {
    console.error('结算失败', error);
  }
}

const onFinish = () => {
  void handleGameCompletion();
};
```

### 写法 2: 在调用处补 `.catch()`

```typescript
const onFinish = () => {
  void handleGameCompletion().catch((error) => {
    console.error('结算失败', error);
  });
};
```

所以要记住:

- `void` 能表达“我故意不接这个 Promise”
- `void` 不能表达“这个 Promise 一定不会报错”

---

## 5. 前端里什么时候适合用 `void`

适合:

- 事件回调里触发异步逻辑,但当前作用域不需要 `await`
- `useEffect`、生命周期、初始化逻辑里启动异步任务
- 需要显式告诉 lint 和团队成员“这个返回值我就是不接”

不太适合:

- 你其实需要拿到结果时
- 你其实应该等待执行完成时
- 你想靠 `void` 来“压掉报错”时

比如下面这种就不该用:

```typescript
const result = await void fetchUserInfo();
```

这样写没有意义,因为 `void` 已经把结果变成 `undefined` 了。

---

## 6. 一句话区分几种写法

```typescript
function a(): void {}
```

表示: `a` 这个函数的返回值类型是 `void`。

```typescript
void a();
```

表示: 调用 `a()` 后,我主动忽略它的返回值。

```typescript
async function a(): Promise<void> {}
```

表示: 这是一个异步函数,最终没有业务返回值,但它仍然返回一个 `Promise`。

---

## 7. 总结

`void` 在前端里最实用的理解就一句话:

**要么表示“这个函数没有有意义的返回值”,要么表示“这个表达式的返回值我故意不要”。**

如果你看到:

```typescript
void handleGameCompletion();
```

可以直接把它理解成:

**触发这个异步操作,但当前这里不等待结果,同时明确告诉代码阅读者:这个 Promise 是我主动忽略的。**

这就是它在现代前端项目里最常见、也最有价值的用法。
