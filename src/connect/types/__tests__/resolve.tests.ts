/* eslint-disable @typescript-eslint/no-unused-vars */
import type { StateMap } from "../generic-store";
import type { ResolveState, ResolveActions } from "../resolve";

describe("ResolveState", () => {
  it("should resolve derived state", () => {
    interface MyState extends StateMap {
      namespace: {
        string: string;
        derivedString: (store: { state: MyState }) => string;
      };
    }
    const state: MyState = {
        namespace: {
          string: "string",
          derivedString: ({ state }) => "string",
          derivedNumber: ({ state }) => 123,
          derivedWithArgs: ({ state }) => (arg1, arg2) => "string"
        }
      },
    };
  });
});
