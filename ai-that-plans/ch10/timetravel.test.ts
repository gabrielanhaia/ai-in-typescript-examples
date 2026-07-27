// NOT A LISTING FROM THE BOOK.
//
// The chapter's four claims, checked. It is the one chapter in the book whose
// central sentence is a negative — "nothing you do here modifies a checkpoint
// that already exists" — and a negative is exactly the kind of claim that
// quietly stops being true.
//
//   1. an edit is an append: the checkpoint it corrects is still there,
//      still holding what it held;
//   2. `asNode` is the program counter, not an audit field;
//   3. writing through an old snapshot's own config branches the thread
//      rather than extending its head, and moves the head to the branch;
//   4. a hand edit obeys the channel's reducer, and `Overwrite` is the only
//      thing that does not.
//
// `MemorySaver`, so nothing here touches ./ch10.sqlite or any other file. No
// key, no container, no network.
import { MemorySaver, Overwrite } from "@langchain/langgraph";
import type { StateSnapshot } from "@langchain/langgraph";
import { beforeEach, describe, expect, it } from "vitest";
import { snapshotAtStep } from "./at.js";
import { buildGraph } from "./graph.js";

const REQUEST = "Verano hybrid, rear hub grinding, under warranty";

let graph: ReturnType<typeof buildGraph>;

beforeEach(() => {
  graph = buildGraph(new MemorySaver());
});

function thread(id: string) {
  return { configurable: { thread_id: id } };
}

async function historyOf(id: string): Promise<StateSnapshot[]> {
  const snaps: StateSnapshot[] = [];
  for await (const snap of graph.getStateHistory(thread(id))) snaps.push(snap);
  return snaps;
}

describe("reading the chain", () => {
  it("writes one checkpoint per superstep, plus the input", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));
    const snaps = await historyOf("t");

    // Six nodes, eight checkpoints: __start__ takes a superstep of its own
    // and step -1 is written from the input itself.
    expect(snaps).toHaveLength(8);
    expect(snaps.at(-1)?.metadata?.step).toBe(-1);
    expect(snaps.at(-1)?.metadata?.source).toBe("input");
    expect(snaps[0]?.metadata?.step).toBe(6);
    expect(snaps.map((s) => s.metadata?.source).slice(0, 7)).toEqual(
      Array<string>(7).fill("loop"),
    );
  });

  it("says where a restart would have resumed at every moment", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));
    const snaps = await historyOf("t");

    expect(snaps.map((s) => s.next.join(",")).reverse()).toEqual([
      "__start__",
      "lookup_order",
      "check_warranty",
      "find_parts",
      "order_part",
      "book_workshop_slot",
      "notify_customer",
      "",
    ]);
  });

  it("finds a checkpoint by step number and refuses to invent one", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));

    const at2 = await snapshotAtStep(graph, "t", 2);
    expect(at2.next).toEqual(["find_parts"]);
    expect(at2.values.partCode).toBe("");
    expect(at2.values.done).toEqual(["lookup_order", "check_warranty"]);

    await expect(snapshotAtStep(graph, "t", 99)).rejects.toThrow(
      /No checkpoint at step 99/,
    );
  });
});

describe("an edit is an append", () => {
  it("leaves the checkpoint it corrects exactly as it was", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));
    const before = await snapshotAtStep(graph, "t", 3);
    expect(before.values.partCode).toBe("HUB-DX-135");

    await graph.updateState(
      thread("t"),
      { partCode: "HUB-VR-142" },
      "find_parts",
    );

    const after = await snapshotAtStep(graph, "t", 3);
    expect(after.config.configurable?.checkpoint_id).toBe(
      before.config.configurable?.checkpoint_id,
    );
    expect(after.values.partCode).toBe("HUB-DX-135");
    expect(after.next).toEqual(["order_part"]);
  });

  it("appends a checkpoint whose source says a human did it", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));
    const was = (await historyOf("t")).length;

    const written = await graph.updateState(
      thread("t"),
      { partCode: "HUB-VR-142" },
      "find_parts",
    );

    const snaps = await historyOf("t");
    expect(snaps).toHaveLength(was + 1);
    expect(snaps[0]?.config.configurable?.checkpoint_id).toBe(
      written.configurable?.checkpoint_id,
    );
    expect(snaps[0]?.metadata?.source).toBe("update");
  });

  it("makes a finished thread runnable again, and the tail re-runs", async () => {
    const first = await graph.invoke({ request: REQUEST }, thread("t"));
    expect(first.message).toContain("HUB-DX-135");
    expect((await graph.getState(thread("t"))).next).toEqual([]);

    await graph.updateState(
      thread("t"),
      { partCode: "HUB-VR-142" },
      "find_parts",
    );
    expect((await graph.getState(thread("t"))).next).toEqual(["order_part"]);

    const second = await graph.invoke(null, thread("t"));
    expect(second.message).toContain("HUB-VR-142");
  });
});

describe("asNode is the program counter", () => {
  it("resumes at the edge out of the node the write is attributed to", async () => {
    for (const [asNode, resumesAt] of [
      ["find_parts", "order_part"],
      ["order_part", "book_workshop_slot"],
      ["book_workshop_slot", "notify_customer"],
    ] as const) {
      const fresh = buildGraph(new MemorySaver());
      await fresh.invoke({ request: REQUEST }, thread(asNode));
      await fresh.updateState(
        thread(asNode),
        { partCode: "HUB-VR-142" },
        asNode,
      );
      expect((await fresh.getState(thread(asNode))).next).toEqual([resumesAt]);
    }
  });

  it("goes nowhere when it is omitted on a finished thread", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));
    await graph.updateState(thread("t"), { partCode: "HUB-VR-142" });

    const state = await graph.getState(thread("t"));
    expect(state.values.partCode).toBe("HUB-VR-142");
    // The values changed and nothing will act on them. An edit that goes
    // nowhere, with no error — which is why the argument is not optional in
    // practice even though it is optional in the signature.
    expect(state.next).toEqual([]);
  });

  it("refuses a node that does not exist", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));
    await expect(
      graph.updateState(thread("t"), { partCode: "X" }, "no_such_node"),
    ).rejects.toThrow(/no_such_node/);
  });
});

describe("a hand edit obeys the reducer", () => {
  it("appends to an accumulating channel rather than setting it", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));
    expect((await graph.getState(thread("t"))).values.done).toHaveLength(6);

    await graph.updateState(thread("t"), { done: "find_parts" }, "check_warranty");

    const done = (await graph.getState(thread("t"))).values.done;
    expect(done).toHaveLength(7);
    // The third entry is still where it was. The write appended; it did not
    // correct anything.
    expect(done[2]).toBe("find_parts");
    expect(done.at(-1)).toBe("find_parts");
  });

  it("replaces it when the write is wrapped in Overwrite", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));

    await graph.updateState(
      thread("t"),
      { done: new Overwrite(["lookup_order", "check_warranty"]) },
      "check_warranty",
    );

    expect((await graph.getState(thread("t"))).values.done).toEqual([
      "lookup_order",
      "check_warranty",
    ]);
  });

  it("records who and why, because the framework's metadata cannot", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));
    await graph.updateState(
      thread("t"),
      {
        partCode: "HUB-VR-142",
        edits: {
          by: "dana",
          field: "partCode",
          from: "HUB-DX-135",
          to: "HUB-VR-142",
          why: "VER-8802 takes the VR-142 hub",
        },
      },
      "find_parts",
    );

    const head = await graph.getState(thread("t"));
    expect(head.values.edits).toHaveLength(1);
    expect(head.values.edits[0].by).toBe("dana");
    // The framework's own metadata knows that somebody edited, and nothing else.
    expect(Object.keys(head.metadata ?? {})).not.toContain("by");
  });
});

describe("forking", () => {
  it("branches from the snapshot's own config instead of the head", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));
    const at3 = await snapshotAtStep(graph, "t", 3);

    const branch = await graph.updateState(
      at3.config,
      { partCode: "HUB-VR-142" },
      "find_parts",
    );
    const out = await graph.invoke(null, branch);

    expect(out.message).toContain("HUB-VR-142");
    // The trunk's own answer is still readable at the checkpoint that wrote it.
    const trunk = await historyOf("t");
    const ends = trunk.filter((s) => s.next.length === 0);
    expect(ends.map((s) => s.values.message).sort()).toEqual([
      "Your HUB-DX-135 is dispatched. We have you in on Tue 09:00.",
      "Your HUB-VR-142 is dispatched. We have you in on Tue 09:00.",
    ]);
  });

  it("moves the thread's head to the branch, which is the sharp edge", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));
    const at3 = await snapshotAtStep(graph, "t", 3);
    const branch = await graph.updateState(
      at3.config,
      { partCode: "HUB-VR-142" },
      "find_parts",
    );
    await graph.invoke(null, branch);

    // Anything that reads the thread by id — a dashboard, a stream, an
    // operator's resume button — is now looking at the branch.
    expect((await graph.getState(thread("t"))).values.message).toContain(
      "HUB-VR-142",
    );
  });

  it("stops step numbers being unique, and parentConfig is what tells them apart", async () => {
    await graph.invoke({ request: REQUEST }, thread("t"));
    const at3 = await snapshotAtStep(graph, "t", 3);
    const branch = await graph.updateState(
      at3.config,
      { partCode: "HUB-VR-142" },
      "find_parts",
    );
    await graph.invoke(null, branch);

    const snaps = await historyOf("t");
    const atStep4 = snaps.filter((s) => s.metadata?.step === 4);
    expect(atStep4).toHaveLength(2);

    // Both claim step 4 and they are different checkpoints, on different
    // lines, distinguishable only by who their parent is.
    const [left, right] = atStep4;
    expect(left?.config.configurable?.checkpoint_id).not.toBe(
      right?.config.configurable?.checkpoint_id,
    );
    expect(left?.parentConfig?.configurable?.checkpoint_id).toBe(
      at3.config.configurable?.checkpoint_id,
    );
  });
});
