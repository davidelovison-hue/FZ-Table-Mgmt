export function trackBy<T>(property: keyof T): (_: number, item: T) => unknown {
  return (_: number, item: T): unknown => item[property];
}
