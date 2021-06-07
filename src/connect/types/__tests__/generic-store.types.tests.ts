/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Store } from "../generic-store";

describe("Generic Store Types", () => {
  it("should accomodate generic stores", () => {
    const store: Store = {
      state: {
        namespace: {
          string: "string",
          number: 123,
          boolean: true,
          derivedString: ({ state }) => "string",
          derivedNumber: ({ state }) => 123,
          derivedWithArgs: ({ state }) => (arg1, arg2) => "string"
        }
      },
      actions: {
        namespace: {
          action1: ({ state, actions }) => {
            // ...
          },
          action2: async ({ state, actions }) => {
            // ...
          },
          action3: ({ state, actions }) => (arg1, arg2) => {
            // ...
          },
          action4: ({ state, actions }) => async (arg1, arg2) => {
            // ...
          }
        }
      }
    };
  });
});
