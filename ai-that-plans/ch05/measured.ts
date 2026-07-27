// ch05/measured.ts
import {
  BaseCheckpointSaver,
  type ChannelVersions,
  type Checkpoint,
  type CheckpointListOptions,
  type CheckpointMetadata,
  type CheckpointTuple,
  type PendingWrite,
} from "@langchain/langgraph-checkpoint";
import type { RunnableConfig } from "@langchain/core/runnables";

/** Wraps any checkpointer and counts what a run spends on
 *  persistence, so your numbers come from your data. */
export class Measured extends BaseCheckpointSaver {
  puts = 0;
  writes = 0;
  ms = 0;

  constructor(private readonly inner: BaseCheckpointSaver) {
    super(inner.serde);
  }

  async #timed<T>(work: () => Promise<T>): Promise<T> {
    const from = performance.now();
    try {
      return await work();
    } finally {
      this.ms += performance.now() - from;
    }
  }

  put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions: ChannelVersions,
  ): Promise<RunnableConfig> {
    this.puts += 1;
    return this.#timed(() =>
      this.inner.put(config, checkpoint, metadata, newVersions),
    );
  }

  putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string,
  ): Promise<void> {
    this.writes += 1;
    return this.#timed(() =>
      this.inner.putWrites(config, writes, taskId),
    );
  }

  getTuple(
    config: RunnableConfig,
  ): Promise<CheckpointTuple | undefined> {
    return this.inner.getTuple(config);
  }

  list(
    config: RunnableConfig,
    options?: CheckpointListOptions,
  ): AsyncGenerator<CheckpointTuple> {
    return this.inner.list(config, options);
  }

  deleteThread(threadId: string): Promise<void> {
    return this.inner.deleteThread(threadId);
  }
}
