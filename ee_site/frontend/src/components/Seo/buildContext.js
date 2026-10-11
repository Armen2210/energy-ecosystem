import { createContext } from "react";

// Only the build renderer provides this collector; there is no server runtime.
export const SeoBuildContext = createContext(null);
