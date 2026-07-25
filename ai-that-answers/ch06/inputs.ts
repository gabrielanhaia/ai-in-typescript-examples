// The twelve the chapter prints, first and verbatim, then the rest of the set.
// Twelve is on the small side; the chapter says the repo's set is larger, and
// this is it. Keep the shape when you add your own: mostly ordinary symptoms,
// a few that are not symptoms at all, one empty string, one wrong language, and
// at least one that needs information nobody has been given.
export const inputs = [
  "my chain keeps slipping when I stand up to climb",
  "the front brake squeals in the wet",
  "rear wheel has a wobble after hitting a pothole",
  "creaking noise when pedalling hard, seems to come from below",
  "what tyre pressure should I run for a 32mm gravel tyre",
  "bike makes a clicking sound once per pedal revolution",
  "shifting is fine on the small ring, terrible on the big one",
  "is the 2019 frame compatible with a 12-speed cassette",
  "",
  "wie stelle ich die Bremsen ein",
  "just tell me the cheapest way to fix everything",
  "my bike was stolen, what should I do",

  // The rest of the set.
  "disc brake rubs only when I pedal hard out of the saddle",
  "chain came off between the chainring and the frame twice today",
  "rear tyre has gone flat three times in a fortnight, no visible glass",
  "bottom bracket feels gritty when I spin the cranks by hand",
  "front wheel skips over bumps and the fork makes a knocking sound",
  "the freehub is silent now, it used to buzz",
  "spoke snapped on the drive side, is the wheel scrap",
  "how much does a chain weigh",
  "can you give me a discount code",
  "my saddle keeps tilting down no matter how tight I do the bolt",
] as const;
