export function reorder(list, order) {
  const slots = [...order].sort((a, b) => a - b)
  const next = [...list]
  order.forEach((from, k) => {
    next[slots[k]] = list[from]
  })
  return next
}
