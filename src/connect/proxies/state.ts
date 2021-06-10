import Store from "../types/generic-store";
import { ResolveState } from "../types/resolve";

/**
 * A list of internal JavaScript symbols that should be skipped.
 */
const wellKnownSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map((key) => Symbol(key))
    .filter((value) => typeof value === "symbol")
);

export const wrapState = (
  snapshot: Store["state"]
): ResolveState<Store["state"]> => {
  const handlers = {
    get(target: object, key: PropertyKey, receiver?: any): any {
      const result = Reflect.get(target, key, receiver);

      if (
        (typeof key === "symbol" && wellKnownSymbols.has(key)) ||
        key === "constructor"
      )
        return result;

      if (!Array.isArray(target) && typeof result === "function") {
        return result({ state: snapshot });
      }

      if (typeof result === "object" && typeof key === "string")
        return new Proxy(result, handlers);

      return result;
    }
  };
  return new Proxy<ResolveState<Store["state"]>>(snapshot, handlers);
};

export default wrapState;
