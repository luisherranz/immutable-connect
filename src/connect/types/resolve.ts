import type {
  Store,
  ActionMap,
  ActionWithArgs,
  ActionWithoutArgs,
  State,
  StateMap,
  StateArray
} from "./generic-store";

/**
 * The same state but with the derived funcitons ready to be consumed.
 */
export type ResolveState<S extends State> = {
  [P in keyof S]: S[P] extends (...args: any[]) => any
    ? ReturnType<S[P]>
    : S[P] extends StateMap
    ? ResolveState<S[P]>
    : S[P] extends StateArray
    ? ResolveState<S[P]>
    : S[P];
};

/**
 * Resolve an action map to a new map of actions that can be consumed.
 */
export type ResolveActions<A extends ActionMap> = {
  [P in keyof A]: A[P] extends ActionWithoutArgs
    ? () => ReturnType<A[P]>
    : A[P] extends ActionWithArgs
    ? (...args: Parameters<ReturnType<A[P]>>) => ReturnType<ReturnType<A[P]>>
    : A[P] extends ActionMap
    ? ResolveActions<A[P]>
    : A[P];
};
