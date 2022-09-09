/**
 * @Author       : 黄键恒
 * @Date         : 2022-09-06 11:11:33
 * @LastEditors  : 黄键恒
 * @LastEditTime : 2022-09-06 11:11:33
 * @FilePath     : /Vuesource/匿名副作用函数/weakmapDemo.js
 */
 const map = new Map()
 const weakmap = new WeakMap()
 
 function test(){
   const foo = {foo:1}
   const bar = {bar:2}
 
   map.set(foo,1)
   weakmap.set(bar, 2)
 }
 
 test()
 console.log(weakmap,map)