import { DeepResolveType } from "valtio";

/**
 * INTERNAL AND GENERAL STORE TYPES.
 *
 * They are general and don't get the specific store type with generics.
 */

/**
 * Store.
 */
export interface InitialStore {
  state: Record<string, any>;
  actions: Record<string, InitialStoreActions>;
}

/**
 * Action without arguments. Can be sync or async.
 *
 * Used internally by the InitialStore.
 */
type InitialStoreActionWithoutArgs = (store: {
  state: any;
  actions: any;
}) => void | Promise<void>;

/**
 * Action with arguments. Can be sync or async.
 *
 * Used internally by the InitialStore.
 */
type InitialStoreActionWithArgs = (store: {
  state: any;
  actions: any;
}) => (...args: any[]) => void | Promise<void>;

/**
 * Map of actions.
 *
 * Used internally by the InitialStore.
 */
interface InitialStoreActionMap {
  [key: string]: InitialStoreActions;
}

/**
 * Action map item. Can contain actions with or without args or other action
 * maps.
 *
 * Used internally by the InitialStore.
 */
type InitialStoreActions =
  | InitialStoreActionWithArgs
  | InitialStoreActionWithoutArgs
  | InitialStoreActionMap;

/**
 * Resolves an action map to a new map of actions that can be consumed.
 *
 * Used internally in `createStore`.
 */
export type ResolveActions<
  Actions extends Record<string, InitialStoreActions>
> = {
  [P in keyof Actions]: Actions[P] extends InitialStoreActionWithoutArgs
    ? () => ReturnType<Actions[P]>
    : Actions[P] extends InitialStoreActionWithArgs
    ? (
        ...args: Parameters<ReturnType<Actions[P]>>
      ) => ReturnType<ReturnType<Actions[P]>>
    : Actions[P] extends Record<string, InitialStoreActions>
    ? ResolveActions<Actions[P]>
    : never;
};

/**
 * INTERNAL AND SPECIFIC STORE TYPES.
 *
 * They get the Store type using generics.
 */

/**
 * Action that belongs to a specific store. It can be sync or async and have
 * args or not.
 *
 * Used internally by the `createStore`.
 */
export interface InitialAction<Store extends InitialStore> {
  (args: { state: Store["state"]; actions: Store["actions"] }):
    | ((...args: any[]) => void | Promise<void>)
    | void
    | Promise<void>;
}

/**
 * Item of an action map that belongs to a specific store.
 *
 * Used internally by the `createStore`.
 */
type InitialActions<Store extends InitialStore> =
  | InitialAction<Store>
  | InitialActionMap<Store>;

/**
 * Map of actions that belong to a specific store.
 *
 * Used internally by the `createStore`.
 */
export interface InitialActionMap<Store extends InitialStore> {
  [key: string]: InitialActions<Store>;
}

/**
 * EXTERNAL TYPES FOR STORE DEFINITION.
 *
 * These are the ones used by the final user.
 */

/**
 * Sync action definition. Can have args or not.
 */
export type Action<
  Store extends InitialStore,
  A1 = null,
  A2 = null,
  A3 = null,
  A4 = null,
  A5 = null,
  A6 = null,
  A7 = null,
  A8 = null,
  A9 = null,
  A10 = null
> = [A1] extends [null]
  ? (store: { state: Store["state"]; actions: Store["actions"] }) => void
  : (store: {
      state: Store["state"];
      actions: Store["actions"];
    }) => (...args: Arguments<A1, A2, A3, A4, A5, A6, A7, A8, A9, A10>) => void;

/**
 * Async action definition. Can have args or not.
 */
export type AsyncAction<
  Store extends InitialStore,
  A1 = null,
  A2 = null,
  A3 = null,
  A4 = null,
  A5 = null,
  A6 = null,
  A7 = null,
  A8 = null,
  A9 = null,
  A10 = null
> = [A1] extends [null]
  ? (store: {
      state: Store["state"];
      actions: Store["actions"];
    }) => Promise<void>
  : (store: {
      state: Store["state"];
      actions: Store["actions"];
    }) => (
      ...args: Arguments<A1, A2, A3, A4, A5, A6, A7, A8, A9, A10>
    ) => Promise<void>;
export interface Actions<T extends InitialStore> {
  [key: string]: Action<T> | Actions<T>;
}

/**
 * Derived state definition.
 */
export type Derived<
  Store extends InitialStore,
  InputOrOutput,
  Output = null
> = [Output] extends [null]
  ? (store: { state: Store["state"] }) => InputOrOutput
  : (store: { state: Store["state"] }) => (input: InputOrOutput) => Output;

/**
 * UTILS.
 */

/**
 * Pass a variable number of arguments.
 */
type Arguments<A1, A2, A3, A4, A5, A6, A7, A8, A9, A10> = [A1] extends [null]
  ? []
  : [A2] extends [null]
  ? [A1]
  : [A3] extends [null]
  ? [A1, A2]
  : [A4] extends [null]
  ? [A1, A2, A3]
  : [A5] extends [null]
  ? [A1, A2, A3, A4]
  : [A6] extends [null]
  ? [A1, A2, A3, A4, A5]
  : [A7] extends [null]
  ? [A1, A2, A3, A4, A5, A6]
  : [A8] extends [null]
  ? [A1, A2, A3, A4, A5, A6, A7]
  : [A9] extends [null]
  ? [A1, A2, A3, A4, A5, A6, A7, A8]
  : [A10] extends [null]
  ? [A1, A2, A3, A4, A5, A6, A7, A8, A9]
  : [A1, A2, A3, A4, A5, A6, A7, A8, A9, A10];

/**
 * Representing a primitive value in JS (and null):
 * https://developer.mozilla.org/en-US/docs/Glossary/Primitive.
 */
type Primitive = number | string | boolean;

/**
 * Represents values that can be serialized in javascript.
 */
export type Serializable =
  | Primitive
  | (Primitive | Record<string, Primitive>)[]
  | Record<string, Primitive>;

/**
 * The `send` function returned by the Redux DevTools.
 */
export type DevToolsSend = <Store extends InitialStore>(
  message: string | { type: string; [key: string]: any },
  snapshot: DeepResolveType<Store["state"]>
) => void;
