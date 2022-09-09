/**
 * @Author       : 黄键恒
 * @Date         : 2022-09-05 20:20:18
 * @LastEditors  : 黄键恒
 * @LastEditTime : 2022-09-09 13:59:37
 * @FilePath     : /Vuesource/响应式数据基本实现/sourceDemo.js
 */
// proxy 拦截实现数据变化的监听

/*
  总结: 可以通过proxy和桶来实现简单的数据变化监听
*/
const bucket = new Set()

const data = { text: 'hello world',ok:true }

const obj = new Proxy(data, {
  // 拦截操读取操作
  get (target, key) { 
    // 将副作用函数effect添加到存储副作用函数的桶中
    bucket.add(effect)

    // 返回属性值
    return target[key]
  },

  set (target, key, newVal) { 
    // 设置属性值
    target[key] = newVal
    // 将副作用函数effect从桶里面取出来执行
    bucket.forEach(fn => fn())
    // return true 代表设置操作成功
    return true
  }
})

function effect () { 
  document.body.innerText = obj.text
}

// ---------执行
effect()

setTimeout(() => { 
  obj.text = 'hello vue3'
}, 3000)
