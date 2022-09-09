/**
 * @Author       : 黄键恒
 * @Date         : 2022-09-06 11:21:10
 * @LastEditors  : 黄键恒
 * @LastEditTime : 2022-09-06 11:21:10
 * @FilePath     : /Vuesource/Weakmap/sourceDemo-simple-reaction copy.js
 */

// key - value 找对应的副作用函数集合
/*
  总结: 通过 target-map map: key-effectFn的数据结构实现 副作用函数以及对应key的连接
*/

let activeEffect; // 用一个全局变量存储被注册的副作用函数
const bucket = new WeakMap(); // 存储副作用函数的桶
const data = { ok:true, text: 'hello world', test: true };
const obj = new Proxy(data, {
  // 拦截操读取操作
  get(target, key) {
    // 将副作用函数, activeEffect添加到存储副作用函数的桶中
    track(target, key)
    // 返回属性值
    return target[key];
  },
  // 拦截操写操作
  set(target, key, newVal) {
    // 设置属性值
    target[key] = newVal;
    // 将副作用函数从桶里面取出来并执行
    trigger(target, key);
  }
});

// 用于注册副作用函数
function effect(fn) {
  activeEffect = fn;
  // 执行副作用函数
  fn();
}

// get 中调用 追踪数据变化
function track(target, key) {
  // 没有activeEffect时，直接返回属性值
  if (!activeEffect) return target[key];

  // 根据target从桶中取出depsMap --- Map类型: target-->depsMap key: 对象, value: map类型 映射每个key对应的副作用函数集合
  let depsMap = bucket.get(target);
  if (!depsMap) {
    // 若对应target不存在depsMap，则创建一个新的Map，并与target关联
    bucket.set(target, (depsMap = new Map()));
  }

  // 再根据target的key从depsMap中取出deps --- Set类型: key-->effectFn key: 属性名, value: 副作用函数集合
  let deps = depsMap.get(key);

  if (!deps) {
    // 若对应key不存在deps，则创建一个新的Set，并与key关联
    depsMap.set(key, (deps = new Set()));
  }
  // 最后将副作用函数effect添加到存储副作用函数的桶中
  deps.add(activeEffect);
}

// 在set中调用 触发变化
function trigger(target, key) {
  // 根据target从桶中取出depsMap, key-->effectFn集合
  const depsMap = bucket.get(target);
  if (!depsMap) return;

  const effects = depsMap.get(key);

  // 执行副作用函数
  effects && effects.forEach((fn) => fn());
  // return true 代表设置操作成功
  return true;
}


// -----执行
effect(() => {
  // 一个匿名的副作用函数
  console.log('effect run'); // 会执行两次, 因为设置的时候会再次触发set操作，里面调用了副作用函数
  document.body.innerText = obj.ok?obj.text:'not';
});

obj.ok = false

setTimeout(() => {
  obj.text = "修改值";
}, 2000);
