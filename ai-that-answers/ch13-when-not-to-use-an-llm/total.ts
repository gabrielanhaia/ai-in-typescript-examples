export function totalPence(items: readonly { pence: number; qty: number }[]) {
  return items.reduce((sum, item) => sum + item.pence * item.qty, 0);
}
