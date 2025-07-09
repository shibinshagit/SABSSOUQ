/**
 * Creates a very small, non-persistent `localStorage` polyfill when code
 * executes on the server (where `window` is undefined).  Import this module
 * once at application start-up to ensure slices and utilities that reference
 * `localStorage` do not crash during SSR or the build step.
 */

function createStorageShim(): Storage {
  const data = new Map<string, string>()

  return {
    get length() {
      return data.size
    },
    clear() {
      data.clear()
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null
    },
    removeItem(key: string) {
      data.delete(key)
    },
    setItem(key: string, value: string) {
      data.set(key, value)
    },
  } as Storage
}

// Attach shim ONLY in non-browser environments
if (typeof window === "undefined" && (globalThis as any).localStorage === undefined) {
  // eslint-disable-next-line no-console
  console.info("[polyfill] injecting localStorage shim for SSR/build")
  ;(globalThis as any).localStorage = createStorageShim()
}
