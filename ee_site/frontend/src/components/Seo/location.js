import { createContext } from "react";

// Routes' backgroundLocation overrides useLocation in a case modal's page.
// SEO needs the actual address, while page/scroll/form behavior keeps its context.
export const SeoLocationContext = createContext(null);
