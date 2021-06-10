/* eslint-disable @typescript-eslint/no-use-before-define */
import { proxy, snapshot, subscribe, useSnapshot } from "valtio";
import { devtools } from "./devtools";
import wrapActions from "./proxies/actions";
import wrapState from "./proxies/state";
import type InitialStore from "./types/generic-store";
import type {
  ResolveActions,
  ResolveState,
  ResolveStore
} from "./types/resolve";
import type { Any } from "ts-toolbelt";
import { memo } from "react";

/**
 * https://excalidraw.com/#json=5473289296150528,PX718mlfznZpqVdZlHSAvg
 *
 * TODO:
 * - ✅ Switch to React Concurrent.
 * - ✅ Add derived state.
 * - ✅ Derived state types.
 * - ✅ Apply Compute to all resolved types.
 * - Reuse action proxies for the same objects (references).
 * - Add onAction hook.
 * - DevTools action messages refactoring.
 * - Reuse state proxies for the same objects (references).
 * - Mutate state passed to components.
 * - Inject store when using `connect()`.
 * - Make sure connected children rerender.
 * - Make sure parents that are subscribed to refs don't rerender (state.users
 * shouldn't rerender if only state.users[3].name changed).
 * - Pass complete action names, including namespaces, to devtools.
 * - Add onMutation hook.
 * - Add onDerived hook.
 * - Replicate `observe()` (for backward compatibility).
 *
 * EXTRAS:
 * - Figure out a way to proxify state to know which action triggered a
 * mutation.
 * - Figure out how to do nested derived state.
 * - ✅ Do not subscribe if `state` is not used (i.e.: `const { actions } =
 * useConnect()`). We are using the "hidden prop subscribition" workaround for now.
 */

const createStore = <Store extends InitialStore>(
  initialStore: Store,
  name: string = "Frontity"
) => {
  // First proxification from valtio. This generates the first proxy that is
  // used to keep track of mutations.
  const mutableState: Store["state"] = proxy(initialStore.state);

  // Initialize the Redux DevTools.
  const { send } = devtools(mutableState, name);
  send("Frontity started", snapshot(mutableState));

  // Init the store to pass its reference to the wrappers.
  const store: ResolveStore<Store> = {
    state: wrapState(mutableState),
    actions: wrapActions(store, initialStore.actions)
  };

  // Add store to window (for debugging).
  (window as any).connect = store;

  return {
    useConnect: () => {
      const snapshot = useSnapshot(mutableState);

      // Fake susbscription. In valtio, components that don't use the `state`
      // are subscribed to all changes and therefore always rerender. This is
      // a problem in components that don't use the `state`, like:
      // `const { actions } = useConnect();
      snapshot.CONNECT; // eslint-disable-line

      return {
        actions: store.actions,
        state: wrapState(snapshot) as Any.Compute<ResolveState<Store["state"]>>
      };
    },
    connect: memo,
    onSnapshot: (fn: (state: InitialStore["state"]) => void) =>
      subscribe(store.state, () => fn(store.state), false)
  };
};

export default createStore;
