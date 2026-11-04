import { useSyncExternalStore } from "react";
import type { Store } from "../services/Store.ts";

export function useStore<T extends object>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
