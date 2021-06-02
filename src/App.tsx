import "./styles.css";
import createStore from "./connect/create-store";
import { Action, AsyncAction, Derived } from "./connect/types";
import { useEffect } from "react";

interface UserType {
  id: number;
  name: string;
  surname: string;
}

interface Store {
  state: {
    users: UserType[];
    isAddingUser: boolean;
    randomNumber: number;
    numberOfUsers: Derived<Store, number>;
  };
  actions: {
    namespace: {
      addUserAsync: AsyncAction<Store, string>;
      addUserSync: Action<Store, string>;
      randomNumber: Action<Store>;
    };
  };
}

let id = 0;

const store: Store = {
  state: {
    users: [],
    isAddingUser: false,
    randomNumber: 0,
    numberOfUsers: ({ state }) => state.users.length
  },
  actions: {
    namespace: {
      addUserAsync: ({ state }) => async (name) => {
        state.isAddingUser = true;
        await new Promise((resolve) => setTimeout(resolve, 1500));
        state.users.push({ id: id++, name, surname: "Async" });
        state.isAddingUser = false;
      },
      addUserSync: ({ state }) => (name) => {
        state.users.push({ id: id++, name, surname: "Sync" });
      },
      randomNumber: ({ state }) => {
        state.randomNumber = Math.ceil(Math.random() * 10);
      }
    }
  }
};

const { useConnect, onSnapshot, connect } = createStore(store);

onSnapshot((state) => {
  console.log(state);
});

const User = connect(function User({ user }: { user: UserType }) {
  // useEffect(() => {
  //   console.log(`User: ${user.id}`);
  // });
  return (
    <h2>
      {user.id}: {user?.name} {user?.surname}
    </h2>
  );
});

const AddUser = connect(function AddUser() {
  const { actions } = useConnect();
  return (
    <>
      <button onClick={() => actions.namespace.addUserAsync("Jon")}>
        Async
      </button>{" "}
      <button onClick={() => actions.namespace.addUserSync("Jon")}>Sync</button>
    </>
  );
});

const AddingUser = connect(function AddingUser() {
  const { state } = useConnect();
  return state.isAddingUser ? <div>Adding user, please wait...</div> : null;
});

const RandomNumber = connect(function RandomNumber() {
  const { state, actions } = useConnect();
  return (
    <div>
      <button onClick={() => actions.namespace.randomNumber()}>
        pick new number
      </button>{" "}
      {state.randomNumber}
    </div>
  );
});

const NumberOfUsers = connect(function NumberOfUsers() {
  const { state } = useConnect();
  return <div>Users: {state.numberOfUsers}</div>;
});

const Empty = connect(function Empty() {
  useConnect();
  useEffect(() => {
    console.log("Empty rerender");
  });
  return <div>Empty</div>;
});

export default function App() {
  const { state } = useConnect();
  return (
    <div className="App">
      <h1>Immutable Connect</h1>
      <RandomNumber />
      {state.users.map((user) => (
        <User key={user.id} user={user} />
      ))}
      <AddUser />
      <AddingUser />
      <NumberOfUsers />
      <Empty />
    </div>
  );
}
