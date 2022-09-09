/**
 * @Author       : 黄键恒
 * @Date         : 2022-08-11 15:02:43
 * @LastEditors  : 黄键恒
 * @LastEditTime : 2022-09-03 09:43:37
 * @FilePath     : /Vuesource/sourceDemo-watch-expiredEffect.js
 */

// lazy computed计算属性
/*
  总结: 
*/
let activeEffect // 用一个全局变量存储被注册的副作用函数
const bucket = new WeakMap() // 存储副作用函数的桶

// 副作用函数栈
const effectStack = []

const data = { foo: 1, bar: 2 }

const obj = new Proxy(data, {
  // 拦截操读取操作
  get(target, key) {
    // 将副作用函数, activeEffect添加到存储副作用函数的桶中
    track(target, key)
    // 返回属性值
    return target[key]
  },
  // 拦截操写操作
  set(target, key, newVal) {
    // 设置属性值
    target[key] = newVal
    // 将副作用函数从桶里面取出来并执行
    trigger(target, key)
  },
})

// get 中调用 追踪数据变化
function track(target, key) {
  // 没有activeEffect时，直接返回属性值
  if (!activeEffect) return target[key]

  // 根据target从桶中取出depsMap --- Map类型: target-->depsMap key: 对象, value: map类型 映射每个key对应的副作用函数集合
  let depsMap = bucket.get(target)
  if (!depsMap) {
    // 若对应target不存在depsMap，则创建一个新的Map，并与target关联
    bucket.set(target, (depsMap = new Map()))
  }

  // 再根据target的key从depsMap中取出deps --- Set类型: key-->effectFn key: 属性名, value: 副作用函数集合
  let deps = depsMap.get(key)

  if (!deps) {
    // 若对应key不存在deps，则创建一个新的Set，并与key关联
    depsMap.set(key, (deps = new Set()))
  }
  // 把当前激活的副作用函数添加到依赖集合deps中
  deps.add(activeEffect)

  // deps就是一个与当前副作用函数存在联系的依赖集合
  // 将其添加到activeEffect.deps数组中
  activeEffect.deps.push(deps) // 新增
}

// 在set中调用 触发变化
function trigger(target, key) {
  // 根据target从桶中取出depsMap, key-->effectFn集合
  const depsMap = bucket.get(target)
  if (!depsMap) return

  const effects = depsMap.get(key)

  const effectsToRun = new Set()

  effects &&
    effects.forEach((effectFn) => {
      // 如果trigger触发执行的副作用函数与当前执行的副作用函数相同，则不触发执行
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })

  effectsToRun.forEach((effectFn) => {
    // 执行副作用函数
    // 如果一个副作用函数存在调度器，则使用该调度器，并将副作用函数作为参数传递
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    }
    // 否则直接执行副作用函数
    else {
      effectFn()
    }
  })
  // effects && effects.forEach((fn) => fn());
  // return true 代表设置操作成功
  return true
}

function cleanup(effectFn) {
  // 遍历 effectFn.deps数组
  for (let i = 0; i < effectFn.deps.length; i++) {
    // deps 是依赖集合
    const deps = effectFn.deps[i]

    // 将effectFn 从依赖集合中移除
    deps.delete(effectFn)
  }
  // 重置effectFn.deps数组
  effectFn.deps.length = 0
}

// 用于注册副作用函数
function effect(fn, options = {}) {
  const effectFn = function () {
    // 调用cleanup清除依赖关系
    cleanup(effectFn)
    // 当effectFn执行时, 将其设置为当前激活的副作用函数
    activeEffect = effectFn

    // 在调用副作用函数之前将当前副作用函数压入栈中
    effectStack.push(effectFn)
    // 执行副作用函数, 将fn的执行结果放入res中
    const res = fn()

    // 在当副作用函数执行完毕后，将当前副作用函数弹出，并把activeEffect还原为之前的值
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  // 将options 挂载到effectFn上
  effectFn.options = options

  // activeEffect.deps 存储所有与该副作用函数相关联的依赖集合
  effectFn.deps = [] // 对应到depsMap中的集合
  // 只有lazy为false才执行副作用函数
  if (!options.lazy) {
    effectFn()
  }
  // 副作用函数作为返回值返回
  return effectFn
}
function watch(source, cb, options = {}) {
  // 定义getter
  let getter
  // 如果source是函数,说明用户传递的是getter,所以直接把source赋值给getter
  if (typeof source === 'function') {
    getter = source
  } else {
    // 否则按照原来的实现调用traverse递归地读取
    getter = () => traverse(source)
  }

  // 定义旧值与新值
  let oldValue, newValue

  // cleanup用来存储用户注册的过期回调
  let cleanup
  // 定义onInvalidate函数
  function onInvalidate(fn) {
    // 将过期的回调存储到cleanup中
    cleanup = fn
  }
  // 提取scheduler调度函数作为一个独立的job函数
  const job = () => {
    // 在scheduler中重新执行副作用函数，得到的新值
    newValue = effectFn()
    // 在调用回调函数cb之前，先调用过期回调
    if (cleanup) {
      cleanup()
    }
    // 当数据变化时，执行回调函数
    cb(newValue, oldValue, onInvalidate)
    // 更新旧值, 不然下一次会得到错误的旧值
    oldValue = newValue
  }

  // 使用effect注册副作用函数时，开启lazy选项，并把返回值存储到effectFn中以便后续手动调用
  const effectFn = effect(
    // 触发读取操作建立联系
    () => getter(),
    {
      lazy: true,
      scheduler: () => {
        // 在调度函数中判断flush是否为'post',如果是,将其放到微任务队列中执行
        if (options.flush === 'post') {
          const p = Promise.resolve()
          p.then(job)
        } else {
          job()
        }
      },
    },
  )

  if (options.immediate) {
    // 当immediate为true时，立即执行job从而触发回调执行
    job()
  } else {
    // 手动调用副作用函数，取得旧值
    oldValue = effectFn()
  }
}

// 遍历函数
function traverse(value, seen = new Set()) {
  // 如果要读取的数据是原始值, 或者已经被读取过了, 那么什么也不做
  if (typeof value !== 'object' || value === null || seen.has(value)) return
  // 将数据添加到seen中, 代表遍历地读取过了, 避免死循环
  seen.add(value)
  //暂时只考虑对象
  for (const k in value) {
    traverse(value[k], seen)
  }
  return value
}

// ------------执行
watch(
  () => obj.foo,
  async (newValue, oldValue, onInvalidate) => {
    // 代表当前副作用函数是否过期, 默认为false，代表没有过期
    let expired = false

    // 调用onInvalidate函数注册一个过期回调
    onInvalidate(() => {
      // 设置expired为true，代表过期
      expired = true
    })

    // 发送网络请求
    const res = await fetch('https://api.github.com/users/solomonxie')

    if (!expired) {
      finalData = res
    }
    console.log('数据变化了', oldValue, newValue)
  },
)

obj.foo++
setTimeout(() => {
  obj.foo++
}, 200)
