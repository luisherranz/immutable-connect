import InitialStore, { Primitive } from "./generic-store";

/**
 * SPECIFIC STORE TYPES.
 *
 * They get the Store type using generics.
 */

/**
 * Action that belongs to a specific store. It can be sync or async and have
 * args or not.
 */
export interface Action<Store extends InitialStore> {
  (store: Store):
    | ((...args: any[]) => void | Promise<void>)
    | void
    | Promise<void>;
}

/**
 * Item of an action map that belongs to a specific store.
 */
type Actions<Store extends InitialStore> = Action<Store> | ActionMap<Store>;

/**
 * Map of actions that belong to a specific store.
 */
export interface ActionMap<Store extends InitialStore> {
  [key: string]: Actions<Store>;
}

/**
 * Derived state that belongs to a specific store. It can have args or not.
 */
export interface Derived<Store extends InitialStore> {
  (store: Omit<Store, "actions">): ((...args: any[]) => Primitive) | Primitive;
}

type State<Store extends InitialStore> =
  | Primitive
  | Derived<Store>
  | StateMap<Store>
  | StateArray<Store>;

interface StateMap<Store extends InitialStore> {
  [key: string]: State<Store>;
}

interface StateArray<Store extends InitialStore> extends Array<Store> {}
