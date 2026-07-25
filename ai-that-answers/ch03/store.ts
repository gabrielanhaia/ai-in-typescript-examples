// Serialise a history to plain data and back. JSON.stringify on the message
// classes keeps their fields and loses their type, so store the role explicitly
// and reconstruct the class on the way in.
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "langchain";

export type StoredMessage = { role: "system" | "human" | "ai"; text: string };

export function store(history: BaseMessage[]): StoredMessage[] {
  const stored: StoredMessage[] = history.map((m) => ({
    role: m.getType() as StoredMessage["role"],
    text: m.text,
  }));
  return stored;
}

export function load(stored: StoredMessage[]): BaseMessage[] {
  return stored.map((m) => {
    switch (m.role) {
      case "system":
        return new SystemMessage(m.text);
      case "human":
        return new HumanMessage(m.text);
      case "ai":
        return new AIMessage(m.text);
    }
  });
}
