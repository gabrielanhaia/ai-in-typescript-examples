// ch02/draw.ts
import { assistant } from "./graph.js";

const drawn = await assistant.getGraphAsync();
console.log(drawn.drawMermaid());
