/**
 * @Author       : 黄键恒
 * @Date         : 2022-09-06 17:40:06
 * @LastEditors  : 黄键恒
 * @LastEditTime : 2022-09-08 20:59:22
 * @FilePath     : /Vuesource/lazy/lazy.js
 */

// lazy computed计算属性
/*
  总结: 有lazy属性的时候可以不立即执行副作用函数，通过getter函数返回副作用函数的计算值(computed)。再设置value和dirty做数据缓存以及数据更新标记(在调度器中更新dirty的值为true因为调度器是在数据变化时执行)。但是发生嵌套时:在副作用函数中读取computed属性值后，再更新计算值中的其中一个元素，想要再触发该副作用函数的话，需要手动调用trigger,那么在读取value的时候就需要手动进行track追踪。
*/
let activeEffect; // 用一个全局变量存储被注册的副作用函数
const bucket = new WeakMap(); // 存储副作用函数的桶

// 副作用函数栈
const effectStack = [];
const data = { foo: 1 };

const obj = new Proxy(data, {
  // 拦截操读取操作
  get(target, key) {
    // 将副作用函数, activeEffect添加到存储副作用函数的桶中
    track(target, key);
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
  // 把当前激活的副作用函数添加到依赖集合deps中
  deps.add(activeEffect);

  // deps就是一个与当前副作用函数存在联系的依赖集合
  // 将其添加到activeEffect.deps数组中
  activeEffect.deps.push(deps); // 新增
}

// 在set中调用 触发变化
function trigger(target, key) {
  // 根据target从桶中取出depsMap, key-->effectFn集合
  const depsMap = bucket.get(target);
  if (!depsMap) return;

  const effects = depsMap.get(key);

  const effectsToRun = new Set();

  effects &&
    effects.forEach((effectFn) => {
      // 如果trigger触发执行的副作用函数与当前执行的副作用函数相同，则不触发执行
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn);
      }
    });

  effectsToRun.forEach((effectFn) => {
    // 执行副作用函数
    // 如果一个副作用函数存在调度器，则使用该调度器，并将副作用函数作为参数传递
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn);
    }
    // 否则直接执行副作用函数
    else {
      effectFn();
    }
  });
  // effects && effects.forEach((fn) => fn());
  // return true 代表设置操作成功
  return true;
}

function cleanup(effectFn) {
  // 遍历 effectFn.deps数组
  for (let i = 0; i < effectFn.deps.length; i++) {
    // deps 是依赖集合
    const deps = effectFn.deps[i];

    // 将effectFn 从依赖集合中移除
    deps.delete(effectFn);
  }
  // 重置effectFn.deps数组
  effectFn.deps.length = 0;
}

// 用于注册副作用函数
function effect(fn, options = {}) {
  const effectFn = function () {
    // 调用cleanup清除依赖关系
    cleanup(effectFn);
    // 当effectFn执行时, 将其设置为当前激活的副作用函数
    activeEffect = effectFn;

    // 在调用副作用函数之前将当前副作用函数压入栈中
    effectStack.push(effectFn);
    // 执行副作用函数, 将fn的执行结果放入res中
    const res = fn();

    // 在当副作用函数执行完毕后，将当前副作用函数弹出，并把activeEffect还原为之前的值
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return res
  };
  // 将options 挂载到effectFn上
  effectFn.options = options;

  // activeEffect.deps 存储所有与该副作用函数相关联的依赖集合
  effectFn.deps = []; // 对应到depsMap中的集合
  // 只有lazy为false才执行副作用函数
  if (!options.lazy) {
    effectFn(); 
  }
  // 副作用函数作为返回值返回
  return effectFn;
}


// ------------执行
// const effectFn = effect(
//     // 不自动执行
//   () => { console.log(obj.foo)},
//   // options
//   {
//     lazy:true
//   }
// );

// 手动执行副作用函数
// effectFn()

// 返回值lazy

const effectFn = effect(
  // 不自动执行
() =>  obj.foo + 1,
// options
{
  lazy:true
}
);

const val = effectFn()
console.log(val,'val')