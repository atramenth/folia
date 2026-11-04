/** Tiny observable, localStorage backed store; works with useSyncExternalStore. */
export abstract class Store<T extends object> {
  private readonly listeners = new Set<() => void>();
  private readonly key: string;
  private state: T;

  protected constructor(key: string, defaults: T) {
    this.key = key;
    this.state = { ...defaults, ...Store.read<Partial<T>>(key) };
  }

  private static read<V>(key: string): V | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as V) : null;
    } catch {
      return null;
    }
  }

  readonly getSnapshot = (): T => this.state;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  protected patch(partial: Partial<T>): void {
    this.state = { ...this.state, ...partial };
    try {
      localStorage.setItem(this.key, JSON.stringify(this.state));
    } catch {
      /* storage unavailable (private mode): keep working in memory */
    }
    this.listeners.forEach((l) => l());
  }
}
