import { InitialStore } from "../types";

/**
 * A list of internal JavaScript symbols that should be skipped.
 */
const wellKnownSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map((key) => Symbol(key))
    .filter((value) => typeof value === "symbol")
);

export const wrapState = (
  snapshot: InitialStore["state"]
): InitialStore["state"] => {
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
  return new Proxy(snapshot, handlers);
};

export default wrapState;
