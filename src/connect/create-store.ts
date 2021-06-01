import { proxy, snapshot, subscribe, useSnapshot } from "valtio";
import { devtools } from "./devtools";
import { createActionProxy } from "./proxies";
import type { InitialStore, ResolveActions } from "./types";
import type { Any } from "ts-toolbelt";
import { memo } from "react";

/**
 * TODO:
 * - ✅ DevTools sync action messages.
 * - ✅ Switch to React Concurrent.
 * - ✅ Add derived state.
 * - Derived state types.
 * - Inject store when using `connect()`.
 * - Make sure connected children rerender.
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
  // First proxification from valtio. This generates the first proxy that is
  // used to keep track of mutations.
  const valtioState = proxy(initialStore.state);

  // Initialize the Redux DevTools.
  const { send } = devtools(valtioState, name);
  send("Frontity started", snapshot(valtioState));

  // Initialize the store to pass it to the proxy creators.
  const store = { state: valtioState, actions: {} };

  store.actions = createActionProxy(store);
  store.state = proxifyState(state);

  // Add store to window (for debugging purpuses).
  (window as any).connect = store;

  return {
    useConnect: () => {
      const snapshot = useSnapshot(state);

      // Fake susbscription. In valtio, components that don't use the `state`
      // are subscribed to "all changes" and therefore always rerender. This is
      // a problem in components that don't use the `state`, like:
      // `const { actions } = useConnect();
      snapshot.CONNECT; // eslint-disable-line

      return {
        actions: store.actions as Any.Compute<ResolveActions<Store["actions"]>>,
        state: wrapState(snapshot, snapshot)
      };
    },
    connect: memo,
    onSnapshot: (fn: (state: Store["state"]) => void) =>
      subscribe(state, () => fn(state), false)
  };
};

export default createStore;
