// NOT A LISTING FROM THE BOOK.
//
// Chapter 3's central claim, checked: "the merge behaviour is the design". The
// chapter states four behaviours for five channels and then spends the rest of
// itself on the consequences. These are the four behaviours, asserted directly
// against a compiled graph — because a reducer is only real once the framework
// is the thing calling it.
//
// No key, no container, no network. The graphs here are two nodes and an edge;
// the only thing under test is what happens to a value on its way into a
// channel.
import { END, MemorySaver, Overwrite, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";
import { advance, record } from "./nodes.js";
import { PlanOnce } from "./plan-channel.js";
import { PlanState, type State } from "./state.js";
import { startOver } from "./reset.js";

const PLAN = [
  { tool: "lookup_order", why: "find the purchase" },
  { tool: "check_warranty", why: "is it in cover" },
];

/** One node, run once, so a write lands through the real channel machinery. */
async function writeOnce(
  update: typeof PlanState.Update,
  seed: typeof PlanState.Update = {},
): Promise<State> {
  const graph = new StateGraph(PlanState)
    .addNode("write", () => update)
    .addEdge(START, "write")
    .addEdge("write", END)
    .compile();
  return graph.invoke(seed);
}

describe("plan — written once", () => {
  it("keeps the first plan and drops the second", async () => {
    const second = [{ tool: "notify_customer", why: "re-planned" }];
    const state = await writeOnce({ plan: second }, { plan: PLAN });
    expect(state.plan).toEqual(PLAN);
  });

  it("accepts the first write, because empty is the only empty", () => {
    expect(PlanOnce.reducer([], PLAN)).toEqual(PLAN);
    expect(PlanOnce.reducer(PLAN, [])).toEqual(PLAN);
  });
});

describe("cursor — last value wins", () => {
  it("replaces rather than accumulating", async () => {
    const state = await writeOnce({ cursor: 4 }, { cursor: 1 });
    expect(state.cursor).toBe(4);
  });

  it("throws when two nodes write it in one superstep", async () => {
    const graph = new StateGraph(PlanState)
      .addNode("left", () => ({ cursor: 1 }))
      .addNode("right", () => ({ cursor: 2 }))
      .addEdge(START, "left")
      .addEdge(START, "right")
      .addEdge("left", END)
      .addEdge("right", END)
      .compile();

    // The collision ch03/collide.ts exists to show. A last-value channel has
    // no answer to two values arriving at once, and says so rather than
    // picking one.
    await expect(graph.invoke({})).rejects.toThrow(/cursor/);
  });
});

describe("results — merged by key", () => {
  it("lets two nodes finish in one step without erasing each other", async () => {
    const graph = new StateGraph(PlanState)
      .addNode("left", () => ({ results: { lookup_order: "ORD-4471" } }))
      .addNode("right", () => ({ results: { check_warranty: "in cover" } }))
      .addEdge(START, "left")
      .addEdge(START, "right")
      .addEdge("left", END)
      .addEdge("right", END)
      .compile();

    const state = await graph.invoke({});
    expect(state.results).toEqual({
      lookup_order: "ORD-4471",
      check_warranty: "in cover",
    });
  });

  it("is emptied only by Overwrite, never by a plain write", async () => {
    const seeded = { plan: PLAN, results: { lookup_order: "ORD-4471" } };

    const merged = await writeOnce({ results: {} }, seeded);
    expect(merged.results).toEqual({ lookup_order: "ORD-4471" });

    const reset = await writeOnce({ results: new Overwrite({}) }, seeded);
    expect(reset.results).toEqual({});
  });
});

describe("messages — appended, and matched by id", () => {
  it("appends a new message and replaces one carrying a known id", async () => {
    const first = new HumanMessage({ id: "m1", content: "hub grinding" });
    const state = await writeOnce({ messages: [first] });
    expect(state.messages).toHaveLength(1);

    const corrected = new HumanMessage({ id: "m1", content: "rear hub grinding" });
    const after = await writeOnce({ messages: [corrected] }, { messages: [first] });
    expect(after.messages).toHaveLength(1);
    expect(after.messages[0]?.content).toBe("rear hub grinding");
  });
});

describe("signal — untracked", () => {
  it("is readable in the run and absent from the checkpoint", async () => {
    const seen: (AbortSignal | undefined)[] = [];
    const graph = new StateGraph(PlanState)
      .addNode("read", (state) => {
        seen.push(state.signal);
        return {};
      })
      .addEdge(START, "read")
      .addEdge("read", END)
      .compile({ checkpointer: new MemorySaver() });

    const config = { configurable: { thread_id: "untracked" } };
    const signal = AbortSignal.timeout(60_000);
    await graph.invoke({ signal }, config);

    expect(seen[0]).toBe(signal);
    // A live handle is not a fact about the run, so it is not in the state
    // a second process would read back.
    expect((await graph.getState(config)).values).not.toHaveProperty("signal");
  });
});

describe("the three nodes written against those channels", () => {
  // `typeof PlanState.Node` is the framework's node type, which is a union
  // wide enough to include a Runnable — so these are driven through a graph,
  // exactly as ch03/walk.ts drives them, rather than called as functions.
  const step = new StateGraph(PlanState)
    .addNode("record", record)
    .addNode("advance", advance)
    .addEdge(START, "record")
    .addEdge("record", "advance")
    .addEdge("advance", END)
    .compile();

  const reset = new StateGraph(PlanState)
    .addNode("startOver", startOver)
    .addEdge(START, "startOver")
    .addEdge("startOver", END)
    .compile();

  it("record writes one key and the channel still accumulates", async () => {
    const first = await step.invoke({ plan: PLAN });
    expect(first.results).toEqual({ lookup_order: "dispatched" });
    expect(first.cursor).toBe(1);

    const second = await step.invoke(first as typeof PlanState.Update);
    expect(second.results).toEqual({
      lookup_order: "dispatched",
      check_warranty: "dispatched",
    });
  });

  it("advance stops at the end of the plan instead of running off it", async () => {
    const at1 = await step.invoke({ plan: PLAN, cursor: 1 });
    expect(at1.cursor).toBe(1);
  });

  it("startOver empties the channel a plain {} would not touch", async () => {
    const settled = await step.invoke({ plan: PLAN });
    const emptied = await reset.invoke(settled as typeof PlanState.Update);
    expect(emptied.results).toEqual({});
    expect(emptied.cursor).toBe(0);
    // The plan survives, because startOver does not write it.
    expect(emptied.plan).toEqual(PLAN);
  });
});
