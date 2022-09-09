/**
 * @Author       : 黄键恒
 * @Date         : 2022-09-06 15:55:02
 * @LastEditors  : 黄键恒
 * @LastEditTime : 2022-09-06 15:55:02
 * @FilePath     : /Vuesource/cleanUp/loop.js
 */
const set = new Set([1])

set.forEach(item => { 
  set.delete(1)
  set.add(1)
  console.log('遍历中')
})

// 创建新的set进行遍历规避无限循环
const newSet = newSet(set)
newSet.forEach(item => { 
  set.delete(1)
  set.add(1)
  console.log('遍历中')
})