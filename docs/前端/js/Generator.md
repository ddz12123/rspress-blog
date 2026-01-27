# Generator 生成器函数的使用

## 什么是 Generator?

Generator（生成器）是 ES6 引入的一种特殊函数,它可以在执行过程中暂停和恢复,允许我们以更优雅的方式处理异步操作和迭代逻辑。与普通函数不同,Generator 函数可以多次返回值,而不是一次性执行完毕。

## 基本语法

Generator 函数通过 `function*` 关键字定义,使用 `yield` 关键字来暂停执行并返回值:

```javascript
function* myGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = myGenerator();
console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 3, done: false }
console.log(gen.next()); // { value: undefined, done: true }
```

调用 Generator 函数不会立即执行函数体,而是返回一个迭代器对象。每次调用 `next()` 方法时,函数会执行到下一个 `yield` 表达式处暂停。

## 核心概念

### 1. yield 表达式

`yield` 关键字用于暂停和恢复生成器函数的执行:

```javascript
function* numberGenerator() {
  console.log('开始执行');
  yield 1;
  console.log('继续执行');
  yield 2;
  console.log('最后执行');
  return 3;
}

const gen = numberGenerator();
gen.next(); // 输出: 开始执行, 返回 { value: 1, done: false }
gen.next(); // 输出: 继续执行, 返回 { value: 2, done: false }
gen.next(); // 输出: 最后执行, 返回 { value: 3, done: true }
```

### 2. next() 方法传参

`next()` 方法可以接收参数,这个参数会作为上一个 `yield` 表达式的返回值:

```javascript
function* communicate() {
  const result1 = yield '你好';
  console.log('收到:', result1);
  
  const result2 = yield '再见';
  console.log('收到:', result2);
}

const gen = communicate();
console.log(gen.next());        // { value: '你好', done: false }
console.log(gen.next('世界'));   // 输出: 收到: 世界, 返回 { value: '再见', done: false }
console.log(gen.next('朋友'));   // 输出: 收到: 朋友, 返回 { value: undefined, done: true }
```

### 3. yield* 表达式

`yield*` 用于在一个 Generator 中委托给另一个 Generator:

```javascript
function* generator1() {
  yield 1;
  yield 2;
}

function* generator2() {
  yield 'a';
  yield* generator1();
  yield 'b';
}

const gen = generator2();
console.log([...gen]); // ['a', 1, 2, 'b']
```

## 实际应用场景

### 1. 实现迭代器

Generator 天然就是迭代器,可以用来自定义迭代行为:

```javascript
function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}

// 使用 for...of 遍历
for (let num of range(0, 10, 2)) {
  console.log(num); // 0, 2, 4, 6, 8
}

// 转换为数组
const arr = [...range(1, 6)]; // [1, 2, 3, 4, 5]
```

### 2. 无限序列

Generator 可以优雅地生成无限序列,只在需要时才计算值:

```javascript
function* fibonacci() {
  let [prev, curr] = [0, 1];
  while (true) {
    yield curr;
    [prev, curr] = [curr, prev + curr];
  }
}

const fib = fibonacci();
console.log(fib.next().value); // 1
console.log(fib.next().value); // 1
console.log(fib.next().value); // 2
console.log(fib.next().value); // 3
console.log(fib.next().value); // 5

// 获取前 10 个斐波那契数
function* take(n, iterable) {
  let count = 0;
  for (let item of iterable) {
    if (count++ >= n) return;
    yield item;
  }
}

console.log([...take(10, fibonacci())]); 
// [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
```

### 3. 异步流程控制

Generator 可以配合 Promise 实现更清晰的异步代码(这也是 async/await 的基础):

```javascript
function* fetchUserData() {
  try {
    const user = yield fetch('/api/user');
    const posts = yield fetch(`/api/posts/${user.id}`);
    const comments = yield fetch(`/api/comments/${posts[0].id}`);
    return { user, posts, comments };
  } catch (error) {
    console.error('获取数据失败:', error);
  }
}

// 简单的执行器
function run(generator) {
  const gen = generator();
  
  function handle(result) {
    if (result.done) return Promise.resolve(result.value);
    
    return Promise.resolve(result.value)
      .then(res => res.json())
      .then(data => handle(gen.next(data)))
      .catch(err => gen.throw(err));
  }
  
  return handle(gen.next());
}

run(fetchUserData);
```

### 4. 状态机

Generator 非常适合实现状态机:

```javascript
function* trafficLight() {
  while (true) {
    yield '红灯';
    yield '绿灯';
    yield '黄灯';
  }
}

const light = trafficLight();
console.log(light.next().value); // 红灯
console.log(light.next().value); // 绿灯
console.log(light.next().value); // 黄灯
console.log(light.next().value); // 红灯 (循环)
```

### 5. 数据流处理

可以用 Generator 实现类似管道的数据处理:

```javascript
function* map(iterable, mapper) {
  for (let item of iterable) {
    yield mapper(item);
  }
}

function* filter(iterable, predicate) {
  for (let item of iterable) {
    if (predicate(item)) yield item;
  }
}

// 使用
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const result = filter(
  map(numbers, x => x * 2),
  x => x > 10
);

console.log([...result]); // [12, 14, 16, 18, 20]
```

## Generator 的方法

### return() 方法

提前终止 Generator 的执行:

```javascript
function* gen() {
  yield 1;
  yield 2;
  yield 3;
}

const g = gen();
console.log(g.next());        // { value: 1, done: false }
console.log(g.return('结束')); // { value: '结束', done: true }
console.log(g.next());        // { value: undefined, done: true }
```

### throw() 方法

向 Generator 内部抛出错误:

```javascript
function* errorHandler() {
  try {
    yield 1;
    yield 2;
  } catch (e) {
    console.log('捕获错误:', e);
  }
  yield 3;
}

const gen = errorHandler();
console.log(gen.next());              // { value: 1, done: false }
console.log(gen.throw('出错了'));      // 输出: 捕获错误: 出错了, 返回 { value: 3, done: false }
console.log(gen.next());              // { value: undefined, done: true }
```

## 性能优势

Generator 的惰性求值特性可以带来性能优势:

```javascript
// 普通方法 - 立即计算所有值
function getRange(n) {
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(i * i);
  }
  return result;
}

// Generator - 按需计算
function* getSquares(n) {
  for (let i = 0; i < n; i++) {
    yield i * i;
  }
}

// 如果只需要前 3 个值
const squares = getSquares(1000000);
const firstThree = [...take(3, squares)]; // 只计算了 3 个值,而不是 100 万个
```

## 注意事项

1. **Generator 函数必须用 function* 声明**,箭头函数不能用作 Generator
2. **yield 只能在 Generator 函数内部使用**,在嵌套函数中使用会报错
3. **Generator 对象是一次性的**,遍历结束后不能重新开始,需要重新创建
4. **性能考虑**:虽然 Generator 很强大,但对于简单场景,普通函数可能更高效
