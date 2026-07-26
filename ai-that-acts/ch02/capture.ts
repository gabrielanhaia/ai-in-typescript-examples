// PRINTED IN CHAPTER 2 as `ch02/capture.ts`.
//
// Put this import first in any listing and the body of each request is
// written to the console on its way out. Five lines that belong nowhere near
// production.
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  console.log(JSON.stringify(JSON.parse(String(init?.body)), null, 2));
  return realFetch(url, init);
};
