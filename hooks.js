const debounce = (func, timeout) => {
  let timer
  return () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func()
    }, timeout)
  }
}

export default function () {
  let Component
  let firstRender = true
  let hooks = []
  let index = 0
  let resetIndex = () => {
    index = 0
  }

  function render(item) {
    if (firstRender) {
      Component = debounce(item, 50)
      resetIndex = debounce(resetIndex, 50)
      firstRender = false
    }
    resetIndex()
    Component()
  }

  function useState(initialState) {
    const currentIndex = index++
    const state = hooks[currentIndex] ?? initialState
    hooks[currentIndex] = state
    function setState(value) {
      const newState = typeof value === 'function' ? value(hooks[currentIndex]) : value
      hooks[currentIndex] = newState
      render()
    }
    return [state, setState]
  }

  function useEffect(callback, deps) {
    let oldDeps = hooks[index]
    const hasChanged = oldDeps ? deps.some((dep, i) => oldDeps[i] !== dep) : true
    if (hasChanged) callback()
    hooks[index] = deps
    index++
  }

  return { render, useState, useEffect }
}
