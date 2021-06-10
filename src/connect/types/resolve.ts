import type InitialStore from "./generic-store";

/**
 * The same state but with the derived funcitons ready to be consumed.
 */
export type ResolveState<State extends object> = {
  [P in keyof State]: State[P] extends (...arg: any[]) => any
    ? ReturnType<State[P]>
    : State[P] extends object
    ? ResolveState<State[P]>
    : State[P];
};

type SingleFunction = (...arg: any[]) => void | Promise<void>;

type DoubleFunction = (
  ...arg: any[]
) => (...arg: any[]) => void | Promise<void>;

type ResolveDoubleFunction<F extends DoubleFunction> = (
  ...arg: Parameters<ReturnType<F>>
) => ReturnType<ReturnType<F>>;

type ResolveSingleFunction<F extends SingleFunction> = () => ReturnType<F>;

/**
 * Resolve an action map to a new map of actions that can be consumed.
 */
export type ResolveActions<Actions extends object> = {
  [P in keyof Actions]: Actions[P] extends DoubleFunction
    ? ResolveDoubleFunction<Actions[P]>
    : Actions[P] extends SingleFunction
    ? ResolveSingleFunction<Actions[P]>
    : Actions[P] extends object
    ? ResolveActions<Actions[P]>
    : Actions[P];
};

export type ResolveStore<Store extends InitialStore> = {
  state: ResolveState<Store["state"]>;
  actions: ResolveActions<Store["actions"]>;
};
