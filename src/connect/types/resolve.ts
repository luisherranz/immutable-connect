import { Any } from "ts-toolbelt";

/**
 * The same state but with the derived funcitons ready to be consumed.
 */
export type ResolveState<S extends object> = {
  [P in keyof S]: S[P] extends (...arg: any[]) => any
    ? ReturnType<S[P]>
    : S[P] extends object
    ? ResolveState<S[P]>
    : S[P];
};

type SingleFunction = (...arg: any[]) => void | Promise<void>;

type DoubleFunction = (
  ...arg: any[]
) => (...arg: any[]) => void | Promise<void>;

type ResolveDoubleFunction<F extends DoubleFunction> = Any.Compute<
  (...arg: Parameters<ReturnType<F>>) => ReturnType<ReturnType<F>>
>;

type ResolveSingleFunction<F extends SingleFunction> = Any.Compute<
  () => ReturnType<F>
>;

/**
 * Resolve an action map to a new map of actions that can be consumed.
 */
export type ResolveActions<A extends object> = {
  [P in keyof A]: A[P] extends DoubleFunction
    ? ResolveDoubleFunction<A[P]>
    : A[P] extends SingleFunction
    ? ResolveSingleFunction<A[P]>
    : A[P] extends object
    ? ResolveActions<A[P]>
    : A[P];
};
