// ch07/namespaces.ts
const ROOT = "braxby";

/** Every namespace in the application is built here. Renaming a
 *  level is then one edit instead of a grep across every node. */
export function customerNs(id: string): string[] {
  return [ROOT, "customer", id];
}

export function preferencesNs(id: string): string[] {
  return [...customerNs(id), "preferences"];
}

export function factsNs(id: string): string[] {
  return [...customerNs(id), "facts"];
}
