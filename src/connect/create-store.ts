import { proxy, snapshot, subscribe, useSnapshot } from "valtio";
import { devtools } from "./devtools";
import wrapActions from "./proxies/actions";
import wrapStateCreator from "./proxies/state";
import type { InitialStore, ResolveActions } from "./types";
import type { Any } from "ts-toolbelt";
import { memo } from "react";

/**
 * TODO:
 * - ✅ DevTools sync action messages.
 * - ✅ Switch to React Concurrent.
 * - ✅ Add derived state.
 * - Try a single-proxy approach.
 * - Derived state types.
 * - Inject store when using `connect()`.
 * - Make sure connected children rerender.
 * - Make sure parents that are subscribed to refs don't rerender (state.users
 * shouldn't rerender if only state.users[3].name changed).
 * - Pass complete action names, including namespaces, to devtools.
 * - Add onMutation hook.
 * - Add onAction hook.
 * - Add onDerived hook.
 * - Replicate `observe()` (for backward compatibility).
 *
 * EXTRAS:
 * - Figure out a way to proxify state to know which action triggered a
 * mutation.
 * - Figure out how to do nested derived state.
 * - ✅ Do not subscribe if `state` is not used (i.e.: `const { actions } =
 * useConnect()`).
 */

const createStore = <Store extends InitialStore>(
  initialStore: Store,
  name: string = "Frontity"
) => {
  // Create the store to pass it down to
  const store: InitialStore = { state: {}, actions: {} };

  // First proxification from valtio. This generates the first proxy that is
  // used to keep track of mutations.
  const valtioState: InitialStore["state"] = proxy(initialStore.state);

  // Initialize the Redux DevTools.
  const { send } = devtools(valtioState, name);
  send("Frontity started", snapshot(valtioState));

  // Proxify the actions with a wrapper that injects the store when an action is
  // executed.
  store.actions = wrapActions(store, initialStore.actions, send);

  // Proxify the state with a wrapper that injects the store to the derived
  // state.
  const wrapState = wrapStateCreator(store);
  store.state = wrapState(valtioState);

  // Add store to window (for debugging).
  (window as any).connect = store;

  return {
    useConnect: () => {
      const snapshot = useSnapshot(valtioState);

      // Fake susbscription. In valtio, components that don't use the `state`
      // are subscribed to all changes and therefore always rerender. This is
      // a problem in components that don't use the `state`, like:
      // `const { actions } = useConnect();
      snapshot.CONNECT; // eslint-disable-line

      return {
        actions: store.actions as Any.Compute<ResolveActions<Store["actions"]>>,
        state: wrapState(snapshot) as Any.Compute<Store["state"]>
      };
    },
    connect: memo,
    onSnapshot: (fn: (state: InitialStore["state"]) => void) =>
      subscribe(store.state, () => fn(store.state), false)
  };
};

export default createStore;
