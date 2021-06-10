/**
 * GENERIC STORE TYPES.
 *
 * They are general and don't get the specific store type via generics.
 */

/**
 * Store.
 */
export interface Store {
  state: Record<string, unknown>;
  actions: Record<string, unknown>;
}

export default Store;

/**
 * Primitive values.
 */
export type Primitive = number | string | boolean;

/**
 * Derived state properties.
 *
 * @example
 * ({ state }) => state.users.length
 */
type DerivedWithoutArgs = (store: Omit<Store, "actions">) => Primitive;

/**
 * Derived state functions.
 *
 * @example
 * ({ state }) => (id) => state.users[id].name
 */
type DerivedWithArgs = (
  store: Omit<Store, "actions">
) => (...args: any[]) => Primitive;

/**
 * Any part of the state.
 */
export type State =
  | Primitive
  | DerivedWithArgs
  | DerivedWithoutArgs
  | StateMap
  | StateArray;

/**
 * A state map. It can contain other maps, arrays, derived state or primitives.
 */
export interface StateMap {
  [key: string]: State;
}

/**
 * A state array. It can contain other arrays, objects, derived state or primitives.
 */
export interface StateArray extends Array<State> {}

/**
 * Action without arguments. It can be sync or async.
 *
 * @example
 * ({ state, actions }) => { ... }
 */
export type ActionWithoutArgs = (store: Store) => void | Promise<void>;

/**
 * Action with arguments. It can be sync or async.
 *
 * @example
 * ({ state, actions }) => (arg1, arg2) => { ... }
 */
export type ActionWithArgs = (
  store: Store
) => (...args: any[]) => void | Promise<void>;

/**
 * Action. It can have args or not and it can be sync or async.
 */
export type Action = ActionWithoutArgs | ActionWithArgs;

/**
 * Map of actions.
 */
export interface ActionMap {
  [key: string]: Actions;
}

/**
 * Action map item. Can contain actions with or without args or other action
 * maps.
 */
export type Actions = ActionWithArgs | ActionWithoutArgs | ActionMap;
