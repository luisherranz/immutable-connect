/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  DeepResolveType,
  proxy,
  snapshot,
  subscribe,
  useSnapshot
} from "valtio";
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

const now = (): string => {
  const date = new Date();
  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
};

/**
 * Store
 */
class Store<T extends InitialStore> {
  readonly name: string;
  readonly #mutableState: T["state"];
  readonly send: (message: string) => void;
  readonly state: ResolveState<T["state"]>;

  constructor(initialStore: T, name: string = "Frontity") {
    this.name = name;
    this.#mutableState = proxy(initialStore.state);
    this.send = this.initDevTools();
    this.state = this.initState();

    // Send initial snapshot.
    this.send("Frontity started");
  }

  initState(): ResolveState<T["state"]> {
    return this.#mutableState;
  }

  initDevTools(): Store<T>["send"] {
    let extension: any;
    let isTimeTraveling = false;
    let prevSnapshot: DeepResolveType<T["state"]>;

    try {
      extension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    } catch {}
    if (!extension) return () => {};

    const devtools = extension.connect({ name: this.name });

    subscribe(this.#mutableState, () => {
      if (isTimeTraveling) {
        isTimeTraveling = false;
      } else {
        const newSnapshot = snapshot(this.#mutableState);
        if (prevSnapshot !== newSnapshot) {
          prevSnapshot = newSnapshot;
          devtools.send(`Update - ${now()}`, newSnapshot);
        }
      }
    });

    devtools.subscribe(
      (message: { type: string; payload?: any; state?: any }) => {
        if (message.type === "DISPATCH" && message.state) {
          if (
            message.payload?.type === "JUMP_TO_ACTION" ||
            message.payload?.type === "JUMP_TO_STATE"
          ) {
            isTimeTraveling = true;
          }
          const nextValue = JSON.parse(message.state);
          Object.keys(nextValue).forEach((key) => {
            (this.#mutableState as any)[key] = nextValue[key];
          });
        } else if (
          message.type === "DISPATCH" &&
          message.payload?.type === "COMMIT"
        ) {
          devtools.init(snapshot(this.#mutableState));
        } else if (
          message.type === "DISPATCH" &&
          message.payload?.type === "IMPORT_STATE"
        ) {
          const actions = message.payload.nextLiftedState?.actionsById;
          const computedStates =
            message.payload.nextLiftedState?.computedStates || [];

          isTimeTraveling = true;

          computedStates.forEach(({ state }: { state: any }, index: number) => {
            const action =
              actions[index] || `Update - ${new Date().toLocaleString()}`;

            Object.keys(state).forEach((key) => {
              (this.#mutableState as any)[key] = state[key];
            });

            if (index === 0) {
              devtools.init(snapshot(this.#mutableState));
            } else {
              devtools.send(action, snapshot(this.#mutableState));
            }
          });
        }
      }
    );

    return (message: string): void => {
      const newSnapshot = snapshot(this.#mutableState);
      prevSnapshot = newSnapshot;
      devtools.send(message, newSnapshot);
    };
  }
}

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
