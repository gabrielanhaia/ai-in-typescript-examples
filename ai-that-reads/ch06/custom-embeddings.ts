// ch06/custom-embeddings.ts
import {
  Embeddings,
  type EmbeddingsParams,
} from "@langchain/core/embeddings";

export interface ProviderFields extends EmbeddingsParams {
  model: string;
  /**
   * Your provider's client, in one call: many texts in, vectors out,
   * in order.
   */
  call: (model: string, texts: string[]) => Promise<number[][]>;
}

export class ProviderEmbeddings extends Embeddings {
  private readonly model: string;
  private readonly call: ProviderFields["call"];

  constructor(fields: ProviderFields) {
    super(fields);
    this.model = fields.model;
    this.call = fields.call;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return this.caller.call(() => this.call(this.model, texts));
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.embedDocuments([text]);
    return vector;
  }
}
