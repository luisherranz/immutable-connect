import { Any } from "ts-toolbelt";
import { DeepResolveType } from "valtio";
import InitialStore from "./generic-store";
import { ResolveActions, ResolveState } from "./resolve";

/**
 * EXTERNAL TYPES FOR STORE DEFINITION.
 *
 * These are the ones used by the final user.
 */

/**
 * Sync action definition. It can have args or not.
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
  ? (store: {
      state: Any.Compute<ResolveState<Store["state"]>>;
      actions: Any.Compute<ResolveActions<Store["actions"]>>;
    }) => void
  : (store: {
      state: Any.Compute<ResolveState<Store["state"]>>;
      actions: Any.Compute<ResolveActions<Store["actions"]>>;
    }) => (...args: Arguments<A1, A2, A3, A4, A5, A6, A7, A8, A9, A10>) => void;

/**
 * Async action definition. It can have args or not.
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
      state: Any.Compute<ResolveState<Store["state"]>>;
      actions: Any.Compute<ResolveActions<Store["actions"]>>;
    }) => Promise<void>
  : (store: {
      state: Any.Compute<ResolveState<Store["state"]>>;
      actions: Any.Compute<ResolveActions<Store["actions"]>>;
    }) => (
      ...args: Arguments<A1, A2, A3, A4, A5, A6, A7, A8, A9, A10>
    ) => Promise<void>;
export interface Actions<T extends InitialStore> {
  [key: string]: Action<T> | Actions<T>;
}

/**
 * Derived state definition. It can have args or not.
 */
export type Derived<
  Store extends InitialStore,
  InputOrOutput,
  Output = null
> = [Output] extends [null]
  ? (store: {
      state: Any.Compute<ResolveState<Store["state"]>>;
    }) => InputOrOutput
  : (store: {
      state: Any.Compute<ResolveState<Store["state"]>>;
    }) => (input: InputOrOutput) => Output;

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
 * The `send` function returned by the Redux DevTools.
 */
export type DevToolsSend = <Store extends InitialStore>(
  message: string | { type: string; [key: string]: any },
  snapshot: DeepResolveType<Store["state"]>
) => void;
