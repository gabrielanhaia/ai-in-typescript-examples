// ch07/recall.ts
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getStore } from "@langchain/langgraph";
import { factsNs, preferencesNs } from "./namespaces.js";
import type { State, Update } from "./state.js";

/** Reads what we already know about this customer once, at the top
 *  of the run, so no later node has to touch the store at all. */
export async function recall(
  state: State,
  config: LangGraphRunnableConfig,
): Promise<Update> {
  const store = getStore(config);
  if (!store) return {};

  const id = state.customerId;
  const prefs = await store.get(preferencesNs(id), "contact");
  const facts = await store.search(factsNs(id), { limit: 100 });

  return {
    known: [
      ...(prefs ? [`Contact by ${String(prefs.value.channel)}.`] : []),
      ...facts.map((f) => String(f.value.text)),
    ],
  };
}
