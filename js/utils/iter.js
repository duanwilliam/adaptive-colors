/**
 * produces an n-length iterable
 * @param {number} n 
 * @returns {never[]}
 */
export const iter = n => Array.from({ length: n })

/**
 * produces n-length ordered sequence from 0 to n-1
 * @param {number} n 
 * @returns {number[]}
 */
export const range = n => iter(n).map((_, i) => i)

/** @type {<T extends any[]>(l: T) => T} */
export const uniq = l => Array.from(new Set(l))

/** @type {(n: number) => <T>(x: T) => T[]} */
export const repeat = n => x => iter(n).map(_ => x)

/**
 * zips on arrays
 * @template {Array<any[]>} L
 * @template {any[]} [Acc=[]]
 * @typedef {L extends [(infer H)[], ...infer T extends Array<any[]>]
 *  ? ZipSimple<T, [...Acc, H]>
 *  : Acc[]
 * } ZipSimple
 */
/**
 * zip on constant tuples: assumes all elements in L are constant tuples
 * @template {Array<any[]>} L
 * @template {any[]} [Cur=[]]
 * @template {any[]} [Rest=[]]
 * @template {any[]} [Acc=[]]
 * @typedef {L extends [infer H extends any[], ...infer T extends Array<any[]>]
 *  ? H extends [infer A, ...infer B extends any[]]
 *    ? ZipExact<T, [...Cur, A], [...Rest, B], Acc>
 *    : Acc
 *  : L extends []
 *    ? ZipExact<Rest, [], [], [...Acc, Cur]>
 *    : L extends Array<(infer X)[]>
 *      ? Array<X[]>
 *      : never
 * } ZipExact
 */
/**
 * @template {Array<any[]>} L
 * @template {Array<any[]>} [O=L]
 * @typedef {L extends [infer H extends any[], ...infer T extends Array<any[]>]
 *  ? H extends [any, ...any[]]
 *    ? Zip<T, O>
 *    : H extends []
 *      ? -3
 *      : H extends (infer X)[]
 *        ? ZipSimple<O>
 *        : -2
 *  : L extends []
 *    ? ZipExact<O>
 *    : -1
 * } Zip
 */
/**
 * @type {<const L extends Array<any[]>>(xs: L) => Zip<L>}
 */
export const zip = xs => range(xs[0].length).map(i => xs.map(x => x[i]))

/**
 * @template {Array<any>} L
 * @template {Array<any[]} [Acc=[]]
 * @typedef {L extends [infer H, ...infer T extends any[]]
 *  ? UnzipFromSingle<T, [...Acc, H[]]
 *  : L extends []
 *    ? Acc
 *    : L extends Array<(infer X)[]>
 *      ? Array<X[]>
 *      : never} UnzipFromSingle
 */
/**
 * @template {Array<any[]>} L
 * @template {any[]} [Cur=[]]
 * @template {any[]} [Rest=[]]
 * @template {any[]} [Acc=[]]
 * @typedef {L extends [infer H extends any[], ...infer T extends Array<any[]>]
 *  ? H extends [infer A, ...infer B extends any[]]
 *    ? Unzip<T,[...Cur, A], [...Rest, B], Acc>
 *    : Acc
 *  : L extends []
 *    ? Unzip<Rest, [], [], [...Acc, Cur]>
 *    : L extends Array<infer X>
*      ? UnzipFromSingle<X>
*      : never
 * } Unzip
 */
/**
 * @type {<const L extends Array<any[]>>(xs: L) => Unzip<L>}
 */
export const unzip = (xs) => xs.reduce((acc, cur) => (acc.forEach((l, i) => l.push(cur[i])), acc), iter(xs[0].length).map(_ => []))

/**
 * @template {any[][]} L
 * @template {any[]} [Acc=[]]
 * @typedef {L extends [infer H extends any[], ...infer T extends Array<any[]>]
 *  ? Flat<T, [...Acc, ...H]>
 *  : L extends []
 *    ? Acc
 *    : L extends Array<infer X extends any[]>
 *      ? X
 *      : never
 * } Flat
 */
/** @type {<const L extends Array<any[]>>(xs: L) => Flat<L>} */
export const flat = xs => xs.flat()

/**
 * @type {<L extends Array<any[]>>(xs: L) => Flat<Zip<L>>}
 */
export const interleave = (xs) => flat(zip(xs))

/**
 * @type {<
 *  F extends (x: any, i: number) => any,
 *  X extends (F extends (x: infer X, ..._: any) => any ? X : never),
 *  R extends (F extends (..._: any) => infer R ? R : never)
 * >(f: F) => (<L extends X[]>(xs: L) => R[])}
 */
export const map = f => xs => xs.map(f)

/**
 * @type {<
 *  F extends (x: any, i: number) => boolean,
 *  X extends (F extends (x: infer X, ..._: any) => any ? X : never)
 * >(f: F) => (<L extends X[]>(xs: L) => L)}
 */
export const filter = f => xs => xs.filter(f)

/** @type {<T>(xs: T[]) => [T, T][]} */
export const pairs = xs => range(xs.length - 1).map(i => [xs[i], xs[i + 1]])

/** @type {<T>(xs: T[]) => [T, T[]]} */
export const split_first = ([x, ...xs]) => [x, xs]

/** @type {(n: number) => <T>(l: T[]) => [T[], T[]]} */
export const split_at = n => l => [l.slice(0, n), l.slice(n)]

/**
 * take up to `n` elements from `l`
 * @type {(n: number) => <T>(l: T[]) => T[]}
 */
export const take = n => l => l.slice(0, n)

/** @type {<X>(x: X) => <L extends X[]>(l) => [...L, X]} */
export const push = x => l => { l.push(x); return l }

/**
 * gets the elements with a unique value for property k.
 * the _last_ element with a given unique value is preserved.
 * resultant elements are in the order the values were _first_ seen
 * 
 * @template {string} K
 * @param {K} k 
 * @returns {<L extends Record<K, any>[]>(l: L) => L}}
 */
export function uniq_by(k) {
  return l => {
    const m = new Map()
    l.forEach(o => m.set(o[k], o))
    return Array.from(m.values())
  }

  /// favor first element with value
  // return l => {
  //   let s = new Set()
  //   return l.reduce((a, c) => {
  //     if (!s.has(c[k])) {
  //       a.push(c)
  //       s.add(c[k])
  //     }
  //     return a
  //   }, [])
  // }
}

/**
 * numeric sort on `f(x)` for every x in l
 * @type {<F extends (arg: any) => number, X extends (F extends (arg: infer X) => any ? X : never)>(f: F) => (l: X[]) => X[]}
 */
export function sort_numeric_by(f) {
  return l => l
    .map((c, i) => [f(c), i])
    .sort((a, b) => a[0] - b[0])
    .map(([_, i]) => l[i])
}

const _min_by = (acc, a, x) => a < acc[0] ? [a, x] : acc
/**
 * @type {<
 *  F extends (x: any) => number,
 *  X extends (F extends (x: infer X) => any ? X : never)
 * >(f: F) => (l: X[]) => X
 * }
 */
export const min_by = f => l => l.reduce((acc, x) => _min_by(acc, f(x), x), [Number.POSITIVE_INFINITY, null])[1]

/** comparator for numeric sorting */
export const numeric = (a, b) => a - b