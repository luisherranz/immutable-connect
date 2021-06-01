import { render, createRoot } from "react-dom";

import App from "./App";

const rootElement = document.getElementById("root");

// Normal Mode
// render(<App />, rootElement);

// Concurrent Mode
createRoot(rootElement).render(<App />);
