/**
 * @Author       : 黄键恒
 * @Date         : 2022-09-05 20:37:20
 * @LastEditors  : 黄键恒
 * @LastEditTime : 2022-09-05 20:37:20
 * @FilePath     : /Vuesource/匿名副作用函数/sourceDemo-anonymous copy.js
 */

// 可读取匿名函数 -- 副作用函数
let activeEffect // 用一个全局变量存储被注册的副作用函数

const bucket = new Set()
const data = { text: 'hello world', ok: false }
const obj = new Proxy(data, {
  // 拦截操读取操作
  get(target, key) {
    // 将副作用函数effect添加到存储副作用函数的桶中
    if (activeEffect) {
      bucket.add(activeEffect)
    }

    // 返回属性值
    return target[key]
  },
  // 拦截操写操作
  set(target, key, newVal) {
    // 设置属性值
    target[key] = newVal
    // 将副作用函数effect从桶里面取出来执行
    bucket.forEach(fn => fn())

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
  console.log('run effect');
  document.body.innerText = obj.text;
});


// --- 缺陷代码引发
 setTimeout(() => {
  obj.notExist = 'hello vue3'
}, 1000)
