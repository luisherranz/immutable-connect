import { InitialStore } from "../types";

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
