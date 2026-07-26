// NOT A LISTING FROM THE BOOK.
//
// Where the sample service is, and where it keeps its data. The listings
// import BASE; the server imports PORT and DB_PATH.
//
// BRAXBY_API_URL is deliberately empty in .env.example. The fallback below is
// the port docker-compose.yml publishes, and it is the port chapter 7 prints
// in its "connect ECONNREFUSED" example.

export const PORT = Number(process.env.BRAXBY_PORT ?? 8788);

export const BASE = process.env.BRAXBY_API_URL || `http://localhost:${PORT}`;

/** The SQLite file. One file, one volume, nothing else on the machine. */
export const DB_PATH =
  process.env.BRAXBY_DB ??
  new URL("../data/braxby.sqlite", import.meta.url).pathname;
