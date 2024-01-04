/**
 * @template [I=any]
 * @template [O=any]
 * @typedef {(arg: I) => O} Fn1
 */

/**
 * @type {<
*  const Fs extends Fn1[],
*  I extends (Fs extends [Fn1<infer I, any>, ...any[]] ? I : never),
*  O extends (Fs extends [...any[], Fn1<any, infer O>] ? O : never)
* >(...fs: Fs) => (x: I) => O}
*/
export const pipe = (...fs) => x => fs.reduce((n, f) => f(n), x)

/**
 * 
 * @type {<
 *  const Fs extends Fn1[],
 *  I extends (Fs extends [...any[], Fn1<infer I, any>] ? I : never),
 *  O extends (Fs extends [Fn1<any, infer O>, ...any[]] ? O : never)
* >(...fs: Fs) => (x: I) => O}
*/
export const compose = (...fs) => x => fs.reduceRight((n, f) => f(n), x)

/** @type {<T>(x: T) => T} */
export const id = x => x