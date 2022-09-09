/**
 * @Author       : 黄键恒
 * @Date         : 2022-09-08 10:33:42
 * @LastEditors  : 黄键恒
 * @LastEditTime : 2022-09-08 10:33:42
 * @FilePath     : /Vuesource/匿名副作用函数/sourceDemo-anonymous copy.js
 */

// 可读取匿名函数 -- 副作用函数
let activeEffect // 用一个全局变量存储被注册的副作用函数

const bucket = new Set(); // 存储副作用函数的桶
const data = { text: 'hello world', test: true }
const obj = new Proxy(data, {
  // 拦截操读取操作
  get(target, key) {
    // 将副作用函数effect添加到存储副作用函数的桶中
    if (activeEffect) {
      // 将副作用函数, activeEffect添加到存储副作用函数的桶中
      bucket.add(activeEffect)
    }

    // 返回属性值
    return target[key]
  },
  // 拦截操写操作
  set(target, key, newVal) {
    // 设置属性值
    target[key] = newVal
    // 将副作用函数从桶里面取出来并执行
    bucket.forEach(fn=>fn())

    // return true 代表设置操作成功
    return true
  },
})

// 用于注册副作用函数
function effect(fn) {
  activeEffect = fn
  // 执行副作用函数
  fn()
}

// ------执行
effect(() => {
  // 一个匿名的副作用函数
  console.log('effect run') // 会执行两次, 因为设置的时候会再次触发set操作，里面调用了副作用函数
  document.body.innerText = obj.text
})

setTimeout(() => {
  obj.text = 'hello vue3'
}, 1000)


