/**
 * @Author       : 黄键恒
 * @Date         : 2022-09-04 11:40:27
 * @LastEditors  : 黄键恒
 * @LastEditTime : 2022-09-04 11:40:28
 * @FilePath     : /Vuesource/编译时运行时/runAndCompile.js
 */
const obj = {
  tag: 'div',
  children: [
    {
      tag: 'span',
      children:'Hello world'
    }
  ]
}

function Render (obj, root) { 
  const ele = document.createElement(obj.tag)
  
  if (typeof obj.children === 'string') {
    const text = document.createTextNode(obj.children)
    ele.appendChild(text)
  }
  else if (obj.children) { 
    // 数组，递归调用Render，使用ele作为root参数
    obj.children.forEach(child => Render(child, ele))
  }

  // 将元素加入到root
  root.appendChild(ele)
}

Render(obj, document.body)