/**
 * @Author       : 黄键恒
 * @Date         : 2022-08-02 16:11:33
 * @LastEditors  : 黄键恒
 * @LastEditTime : 2022-08-02 16:11:33
 * @FilePath     : /vueSource/sourceDemo-nest copy.js
 */

// 无限循环递归
/*
  总结: 在trigger的时候添加守卫条件，当trigger执行的副作用函数与当前副作用函数相同则不触发执行。 同时，先读取属性值，再自身++操作，会连续发生两次get操作，而因为栈的原因，第二次get操作的activeEffect值为undefined所以会直接返回get函数。所以trigger里面的activeEffect会与当前activeEffect不相同。
*/
debugger
let activeEffect; // 用一个全局变量存储被注册的副作用函数
const bucket = new WeakMap(); // 存储副作用函数的桶

// 副作用函数栈
const effectStack = [];
// const data = { text: 'hello world', ok: true };
const data = { foo: 1, bar: false };
let temp1, temp2

const obj = new Proxy(data, {
  // 拦截操读取操作
  get (target, key) {
    console.log('run get', key);
    // 将副作用函数, activeEffect添加到存储副作用函数的桶中
    track(target, key);
    // 返回属性值
    return target[key];
  },
  // 拦截操写操作
  set(target, key, newVal) {
    // 设置属性值
    console.log('run set', key, newVal);
    target[key] = newVal;
    // 将副作用函数从桶里面取出来并执行
    trigger(target, key);
  }
});

// get 中调用 追踪数据变化
function track (target, key) {
  console.log('run track', key);
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
function trigger (target, key) {
  console.log('run trigger', key);
  // 根据target从桶中取出depsMap, key-->effectFn集合
  const depsMap = bucket.get(target);
  if (!depsMap) return;

  const effects = depsMap.get(key);

  const effectsToRun = new Set()

  effects && effects.forEach(effectFn => { 
    // 如果trigger触发执行的副作用函数与当前执行的副作用函数相同，则不触发执行
    if (effectFn !== activeEffect) { 
      effectsToRun.add(effectFn);
    }
  })

  effectsToRun.forEach(effectFn => {
    // 执行副作用函数
    effectFn();
  });
  // effects && effects.forEach((fn) => fn());
  // return true 代表设置操作成功
  return true;
}

function cleanup (effectFn) {
  console.log('run cleanup');
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
function effect (fn) {
  const effectFn = function () {
    // 调用cleanup清除依赖关系
    cleanup(effectFn)
    // 当effectFn执行时, 将其设置为当前激活的副作用函数
    activeEffect = effectFn;

    // 在调用副作用函数之前将当前副作用函数压入栈中
    effectStack.push(effectFn)
    // 执行副作用函数
    fn();

    // 在当副作用函数执行完毕后，将当前副作用函数弹出，并把activeEffect还原为之前的值
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }
  // activeEffect.deps 存储所有与该副作用函数相关联的依赖集合
  effectFn.deps = [] // 对应到depsMap中的集合
  // 执行副作用函数
  effectFn()
}

// ------------执行
effect(function effectFn1 () { 
  console.log('effectFn1 执行')
  document.body.innerText = obj.foo
  // effect(function effectFn2 () { 
  //   console.log('effectFn2 执行')
  //   // effect2 读取obj.bar属性
  //   temp2 = obj.bar;
  // })
  // effectFn1 读取obj.foo属性
})

setTimeout(() => { 
  obj.foo = obj.foo + 1
},1000)

// setTimeout(() => { 
//   obj.foo = false
// },1000)

// effect(() => {
//   // 一个匿名的副作用函数
//   console.log('run effect');
//   document.body.innerText = obj.ok ? obj.text : 'not';
// });

// setTimeout(() => {
//   console.log('run 修改 ok和text');
//   obj.ok = true;
//   obj.text = 'wowwww';
// }, 1000);

// setTimeout(() => {
//   console.log('run 修改 ok和text 2');
//   obj.ok = true;
//   obj.text = 'wowwww222';
// }, 3000);

