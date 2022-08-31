/**
 * @Author       : 黄键恒
 * @Date         : 2022-08-01 14:09:53
 * @LastEditors  : 黄键恒
 * @LastEditTime : 2022-08-01 14:09:53
 * @FilePath     : /vueSource/sourceDemo-simple-reaction.js
 */

// 分支切换 解除依赖关系 
/*
  总结: 如果没有触发get操作，就没有办法触发副作用函数。修改ok的值后，会因为执行副作用函数导致读取ok的值触发get方法，因为get方法中会将对应的副作用函数与对应的key值进行绑定。而每次执行副作用函数的时候会把该绑定删除，若前值为false导致后值无法读取的时候，到trigger函数则无法读取绑定，从而导致无法触发副作用函数
*/
let activeEffect; // 用一个全局变量存储被注册的副作用函数
const bucket = new WeakMap(); // 存储副作用函数的桶
// const data = { text: 'hello world', ok: true };
const data = {ok: true, foo: true, bar: false,text: 'hello world' };
let temp1, temp2
debugger
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

  const effectsToRun = new Set(effects)
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
    // 执行副作用函数
    fn();
  }
  // activeEffect.deps 存储所有与该副作用函数相关联的依赖集合
  effectFn.deps = [] // 对应到depsMap中的集合
  // 执行副作用函数
  effectFn()
}

// ------------执行
// effect(() => {
//   // 一个匿名的副作用函数
//   console.log('run effect');
//   document.body.innerText = obj.ok ? obj.text : 'not';
// });

// setTimeout(() => {
//   console.log('run 修改 ok和text');
//   obj.ok = false;
// }, 1000);

// setTimeout(() => {
//   console.log('run 修改 ok和text 2');
//   obj.text = 'wowwww222';
// }, 3000);

// 缺陷触发
effect(function effectFn1 () { 
  console.log('effectFn1 执行')

  effect(function effectFn2 () { 
    console.log('effectFn2 执行')
    // effect2 读取obj.bar属性
    temp2 = obj.bar;
  })
  // effectFn1 读取obj.foo属性
  temp1 = obj.foo;
})

setTimeout(() => { 
  obj.foo = false
},1000)

