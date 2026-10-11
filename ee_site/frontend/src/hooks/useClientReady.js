import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const client = () => true;
const server = () => false;

// SSR and the first hydration render agree. Enable browser-only UI only after
// React has attached handlers; no early input is discarded during hydration.
export function useClientReady() {
  return useSyncExternalStore(subscribe, client, server);
}
