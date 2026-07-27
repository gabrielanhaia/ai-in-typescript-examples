// NOT A LISTING FROM THE BOOK.
//
// The chapter's second experiment: "Add a channel called `planner` to
// `PlanState` while the graph still has a `planner` node. The builder refuses
// at `addNode`, before anything runs, and the message tells you exactly which
// name is doubly booked."
//
// This is also the reason the chapter's plan-producing node is called
// `planner` rather than `plan`: the channel already owns `plan`.
//
// Nothing is compiled and nothing is invoked, so the error arrives at the
// builder call. No key needed.
import { StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";
import { PlanState } from "./state.js";

// The five channels of PlanState, plus one that steals a node's name.
const ClashState = new StateSchema({
  ...PlanState.fields,
  planner: z.string().default(""),
});

try {
  new StateGraph(ClashState).addNode("planner", () => ({}));
  console.log("no error — the builder allowed the collision");
} catch (error) {
  console.log((error as Error).message);
}
