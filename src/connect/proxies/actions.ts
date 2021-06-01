import { snapshot } from "valtio";
import type {
  InitialStore,
  InitialAction,
  InitialActionMap,
  DevToolsSend
} from "../types";

/**
 *
 * @param action - The action that is about to be run.
 * @param store - The store containing state and actions.
 * @param name - The name of this action.
 * @param send - The send method of the redux devtools.
 */
const actionExecuter = <Store extends InitialStore>(
  action: InitialAction<Store>,
  store: Store,
  name: string,
  send: DevToolsSend
) => (...args: any[]): Promise<void> | void => {
  // Run the action injecting the store.
  const first = action(store);

  /**
   * If it returns a promise, it is an async action. We wait until it is
   * resolved to resolve the wrapper. We also send the proper messages to the
   * DevTools.
   *
   * @example
   * async ({ state, actions }) => { ... }
   */
  if (first instanceof Promise) {
    send(`"${name}" started (async)`, snapshot(store.state));

    return new Promise((resolve, reject) =>
      first
        .then(() => {
          send(`"${name}" finished (async)`, snapshot(store.state));
          resolve();
        })
        .catch((err) => {
          send(`"${name}" errored (async)`, snapshot(store.state));
          reject(err);
        })
    );
  }

  // If it returns another function, it is an action with arguments.
  if (typeof first === "function") {
    // We execute the function again, this time passing the original arguments.
    const second = first(...args);

    /**
     * If it returns a promise, it is an async action. We wait until it is
     * resolved to resolve the wrapper. We also send the proper messages to the
     * DevTools.
     *
     * @example
     * ({ state, actions }) => async (arg1, arg2, ...) => { ... }
     */
    if (second instanceof Promise) {
      send(
        { type: `"${name}" started (async)`, ...args },
        snapshot(store.state)
      );

      return new Promise((resolve, reject) =>
        second
          .then(() => {
            send(`"${name}" finished (async)`, snapshot(store.state));
            resolve();
          })
          .catch((err) => {
            send(`"${name}" errored (async)`, snapshot(store.state));
            reject(err);
          })
      );
    }

    /**
     * If it doesn't return a promise, the action is sync.
     *
     * @example
     * ({ state, actions }) => (arg1, arg2, ...) => { ... }
     */
    send({ type: `"${name}"`, ...args }, snapshot(store.state));
    return;
  }

  /**
   * Finally, if it didn't return a function nor a promise, it means the
   * action is sync and doesn't have arguments.
   *
   * @example
   * ({ state, actions }) => { ... }
   */
  send(`"${name}"`, snapshot(store.state));
};

/**
 * Wraps the actions of the store in a recursive proxy that takes care of
 * injecting the store when executing the actions, like:
 * ```js
 * ({ state, actions }) => {
 *  //...
 * };
 * ```
 *
 * @param store - The store containing actions and state.
 * @param send - The send method of the redux devtools.
 */
export const actionsProxy = <Store extends InitialStore>(
  store: Store,
  send: DevToolsSend
): InitialActionMap<Store> => {
  // Create a handlers object that will be reused by all proxies using the
  // closure of the `store`.
  const handlers = {
    get(target: object, key: PropertyKey, receiver?: any) {
      // Get the action (or action map).
      const action = Reflect.get(target, key, receiver);

      // If it is an action, execute it using the wrapper.
      if (typeof action === "function")
        return actionExecuter(action, store, key.toString(), send);

      // If it is not a map, throw. Only actions and maps of actions are
      // allowed.
      if (typeof action !== "object")
        throw new Error("Only actions or objects can be defined in `actions`.");

      // If it is a map, wrap it again with the proxy.
      return new Proxy<InitialActionMap<Store>>(action, handlers);
    }
  };

  // Wrap the first map of actions with the proxy.
  return new Proxy<InitialActionMap<Store>>(store.actions, handlers);
};

/**
 * A list of internal JavaScript symbols that should be skipped.
 */
const wellKnownSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map((key) => Symbol(key))
    .filter((value) => typeof value === "symbol")
);

export const wrapState = <Store extends InitialStore>(
  state: Store["state"],
  snapshot?: Store["state"]
): Store["state"] => {
  return new Proxy(state, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      if (
        (typeof key === "symbol" && wellKnownSymbols.has(key)) ||
        key === "constructor"
      )
        return result;

      if (!Array.isArray(target) && typeof result === "function")
        return result({
          state: snapshot || store.state,
          actions: store.actions
        });

      if (typeof result === "object") return wrapState(result, snapshot);

      return result;
    }
  });
};
