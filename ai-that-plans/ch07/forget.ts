// ch07/forget.ts
import type {
  BaseCheckpointSaver,
  BaseStore,
} from "@langchain/langgraph";
import { customerNs } from "./namespaces.js";

/** Both kinds, or neither. Threads are named by the caller, so the
 *  caller is the only one who can hand over the list. */
export async function forget(
  customerId: string,
  threadIds: string[],
  checkpointer: BaseCheckpointSaver,
  store: BaseStore,
): Promise<void> {
  for (const threadId of threadIds) {
    await checkpointer.deleteThread(threadId);
  }

  const prefix = customerNs(customerId);
  const spaces = await store.listNamespaces({ prefix, limit: 1000 });

  for (const namespace of spaces) {
    const items = await store.search(namespace, { limit: 1000 });
    for (const item of items) {
      await store.delete(namespace, item.key);
    }
  }
}
