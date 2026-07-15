export function debounce(fn, wait = 250) {
  let t
  return function (...args) {
    const ctx = this
    clearTimeout(t)
    t = setTimeout(() => fn.apply(ctx, args), wait)
  }
}
