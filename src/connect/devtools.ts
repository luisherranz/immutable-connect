import { snapshot, subscribe, DeepResolveType } from "valtio";

const now = (): string => {
  const date = new Date();
  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
};

export const devtools = <T extends object>(
  proxyObject: T,
  name?: string
): {
  unsubscribe?: () => void;
  send: (
    message: string | { type: string; [key: string]: any },
    snapshot: DeepResolveType<T>
  ) => void;
} => {
  let extension: any;
  let isTimeTraveling = false;
  let prevSnapshot: DeepResolveType<T>;

  try {
    extension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
  } catch {}
  if (!extension) {
    return {
      send: () => {}
    };
  }

  const devtools = extension.connect({ name });

  const unsub1 = subscribe(proxyObject, () => {
    if (isTimeTraveling) {
      isTimeTraveling = false;
    } else {
      const newSnapshot = snapshot(proxyObject);
      if (prevSnapshot !== newSnapshot) {
        prevSnapshot = newSnapshot;
        devtools.send(`Update - ${now()}`, newSnapshot);
      }
    }
  });

  const unsub2 = devtools.subscribe(
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
          (proxyObject as any)[key] = nextValue[key];
        });
      } else if (
        message.type === "DISPATCH" &&
        message.payload?.type === "COMMIT"
      ) {
        devtools.init(snapshot(proxyObject));
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
            (proxyObject as any)[key] = state[key];
          });

          if (index === 0) {
            devtools.init(snapshot(proxyObject));
          } else {
            devtools.send(action, snapshot(proxyObject));
          }
        });
      }
    }
  );

  return {
    unsubscribe: () => {
      unsub1();
      unsub2();
    },
    send: (message, snapshot) => {
      prevSnapshot = snapshot;
      devtools.send(message, snapshot);
    }
  };
};
