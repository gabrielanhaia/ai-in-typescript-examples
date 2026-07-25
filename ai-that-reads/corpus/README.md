# The Braxby Cycles corpus

The sample document set for **Book 2, *AI That Reads***. Every retrieval
measurement printed in that book is taken over the files in this directory, so
the corpus is committed, versioned and stable rather than downloaded at run
time.

**Braxby Cycles is fictional.** It is the bicycle-parts retailer the running
example has served since Book 1. Every document here was written for this repo
and is MIT-licensed with the rest of it: there is no third-party licence to
honour, no attribution to carry, and no link to rot. Every price, part number,
policy date, serial number and email address is invented. The domain is
`braxbycycles.example`, on the reserved `.example` TLD, and there are no
telephone numbers, postcodes or personal names anywhere in the set.

The corpus is **deliberately imperfect**. It contains a two-column PDF page that
linearises into nonsense, a table that loses its columns, a page with no text
layer at all, four different statements of the same returns policy, a product
code that semantic search alone will not find, and five questions whose answers
are simply not here. Those are not defects. They are the failures the book
teaches, planted where a chapter can point at them.

**31 documents, ~18,400 extractable words** (plus 134 words that exist only as
pixels — see the price list, below).

---

## Using it

The ingestion root is this directory, and the glob is:

```
corpus/{markdown,html,pdf}/**/*
```

**`corpus/tools/` is not part of the corpus.** It holds the generator and the
verifier. Indexing it would leak the price-list text that
`workshop-price-list-2026.pdf` deliberately hides.

Rebuild the PDFs (they are committed, so you do not need to):

```bash
python3 -m venv .venv
.venv/bin/pip install reportlab pillow pypdf
.venv/bin/python corpus/tools/build_pdfs.py
```

Output is byte-stable — a rebuild on unchanged source produces identical files.

Check that the corpus still says what `questions.jsonl` claims it says:

```bash
.venv/bin/python corpus/tools/verify_corpus.py
```

That script is the guard rail. It fails if a planted fact moves, if a null
question becomes answerable, if `BRK-1180` acquires a second home, or if any
file other than the price list starts extracting to nothing. **Run it after
editing anything in here.**

---

## What each file is

### Markdown — `corpus/markdown/`

Internal policy and procedure documents. The policy set carries YAML front
matter (`doc_id`, `owner`, `status`, `effective`, `review_due`); the staff
handbook does not, and uses a plain "Last updated" line instead. That
inconsistency is real-corpus behaviour and is left in on purpose — chapter 3's
metadata decision has to cope with both.

| File | Words | What it is |
|---|---|---|
| `warranty-policy.md` | 1,216 | The customer warranty policy. Definitions, exclusions, consumables, crash replacement, term by category, claims procedure. The single densest source of planted traps. |
| `returns-and-refunds.md` | 670 | Customer-facing returns policy. The 30-day window, what "unfitted" means, refunds, exchanges. |
| `shipping-and-delivery.md` | 597 | Territories, the three UK weight bands, the £60 free-delivery threshold, next-day cut-off, click and collect, lost parcels. |
| `service-intervals.md` | 685 | Workshop-recommended maintenance intervals for brakes, drivetrain, wheels, frame. |
| `workshop-service-terms.md` | 668 | Booking, customer-supplied parts, quotations, storage, work the workshop refuses. |
| `workshop-service-bulletins-2026.md` | 688 | Seven dated technical bulletins binding on workshop staff. Bulletin 2026-04 is the only document in the corpus containing `BRK-1180`. |
| `superseded-parts-register.md` | 541 | Fourteen discontinued part numbers and their successors. Built as a decoy: a wall of `BRK-`, `DRV-`, `WHL-` codes that looks like the right answer to a part-number query and is not. |
| `price-promise-and-discounts.md` | 498 | Price-match conditions, discount-code rules, sale pricing, what staff may offer. |
| `order-lifecycle-and-statuses.md` | 664 | The twelve order statuses, the pick queue, short lines, cancellation, what triggers an email. |
| `complete-bike-pre-delivery-inspection.md` | 661 | Workshop PDI procedure. Reinforces the "workshop-built assembly" definition from a second direction. |
| `data-and-privacy-summary.md` | 585 | What customer data is held and for how long. Dry, and mostly a distractor. |
| `glossary-of-shop-terms.md` | 619 | Twenty-two short definitions. Useful for structure-aware chunking demos: very short sections, no long prose. |
| `braxby-cycles-overview.md` | 528 | Company overview. The six house ranges and their part-number prefixes, the two sites, the four teams. Names no founder and no VAT number, on purpose. |
| `staff-handbook/01-opening-and-closing.md` | 552 | Workshop hours, opening and closing checklists, keys and alarms. |
| `staff-handbook/02-workshop-safety.md` | 770 | PPE, brake fluid, solvents, compressed air, e-bike batteries, fire. |
| `staff-handbook/03-customer-conversations.md` | 717 | Tone, prices, compatibility questions, complaints, handovers. |
| `staff-handbook/04-returns-desk.md` | 704 | Internal returns procedure. Carries the discriminating detail the customer-facing policy does not. |
| `staff-handbook/05-stock-and-goods-in.md` | 718 | Receiving, putting away, picking, packing, stock counts, hazardous lines. |

### HTML — `corpus/html/`

Real page furniture around the content: a cookie banner, a promo strip, an
eight-item nav, a search form, breadcrumbs, a sidebar, "customers also bought",
a reviews placeholder, a newsletter form, and a three-column footer. Every page
carries the same shell, so chapter 3's Cheerio selection has something genuine
to select away. Content lives under `main#content`; the useful selectors are
`main#content article.doc` and `main#content article.product .product__body`.

| File | Words (visible) | What it is |
|---|---|---|
| `faq.html` | 789 | Twenty-three questions across delivery, returns, warranty, workshop and ordering. Restates four policies in customer voice — the richest near-duplicate source in the corpus. |
| `product-halvard-r4-caliper.html` | 453 | Product page for `BRK-2200`, with a spec table. |
| `product-emberly-xr-wheelset.html` | 477 | Product page for `WHL-5120`, with a spec table that has **no weight row**, and a recall notice pointing at `WHL-5104`. |
| `product-draycott-gravel-45-tyre.html` | 467 | Product page for `TYR-6130`, with a spec table and a hookless-rim warning. |
| `workshop-booking.html` | 543 | Booking page. Restates hours, customer-supplied-parts rules and quotation policy in web voice. |

### PDF — `corpus/pdf/`

All eight are generated by `tools/build_pdfs.py`, which is the source of every
word in them. Five are ordinary, well-behaved documents so that the set is not
uniformly hostile; three are traps.

| File | Words extractable | Pages | What it is |
|---|---|---|---|
| `terms-of-sale-2026.pdf` | 1,073 | 3 | Terms and conditions of sale, in legal register. Ten numbered clauses. Clean single column. |
| `trade-account-terms-2026.pdf` | 635 | 2 | Trade account terms: payment, minimum order, restocking, warranty, pricing. Clean single column. |
| `safety-recall-2025-11.pdf` | 362 | 1 | Recall notice for the 2024 `WHL-5104` front hub, with an affected serial range. Clean single column. |
| `wheelbuilding-standard-2026.pdf` | 490 | 1 | Workshop standard: tension targets, truing tolerances, sign-off. Clean single column. |
| `supplier-onboarding-checklist-2026.pdf` | 407 | 1 | Buying's checklist for a new supplier. Clean single column, and mostly a distractor. |
| `catalogue-2026-brakes-spread.pdf` | 429 | 1 | **Two-column trap.** A range-guide spread comparing the R4 and R2 calipers. |
| `compatibility-2026.pdf` | 234 | 1 | **Table trap.** Rotor and adapter compatibility, eight rows, seven columns, one very long row. |
| `workshop-price-list-2026.pdf` | **0** | 1 | **No-text-layer trap.** The workshop price list, rendered to a raster image and embedded. 134 words of content, none of it extractable. |

---

## The planted traps

Each row names the file, what was done to it, what breaks, and the chapter that
uses it. The "verified by" column names the check in `tools/verify_corpus.py` or
the question in `questions.jsonl` that would fail if the trap were ever
accidentally removed.

| # | File | The trap | What breaks | Chapter | Verified by |
|---|---|---|---|---|---|
| 1 | `pdf/catalogue-2026-brakes-spread.pdf` | The two columns are written to the content stream **one row at a time** — left cell, then right cell, at the same `y`. Both a stream-order extractor and a `(y, x)`-sorting extractor therefore interleave them. | The extracted text reads "…The R4 is supplied with sintered pads / standard. Organic pads bed in within a few stops…". The R4's pad compound and the R2's are fused into one sentence. Any answer taken from this text is wrong about at least one caliper. | **3** | `q21` |
| 2 | `pdf/compatibility-2026.pdf` | The table is drawn as positioned cells with **no delimiters between columns**. Header cells and body cells become separate lines with nothing linking them. | The extraction gives `post 160 mm` / `180 mm` on adjacent lines with the `Frame mount` and `Rotor` headers stranded seven lines above the first row and thirty above the fourth. Which number is the mount and which is the rotor is unrecoverable from the text alone. | **3** | `q22` |
| 3 | `pdf/compatibility-2026.pdf` (row 4) | **A long row.** Seven cells ending in an 83-character note that wraps onto two extra lines under the note column, stranding the wrapped remainder from its own row. | The linearised text reads `BRK-2200 R4 rear post 160 mm 180 mm see bulletin 30 mm offset differs from front; see / workshop bulletin 2026-04 / before ordering an adapter`. The row's identity is gone: the note now floats between rows, and `30 mm` has no column. | **3**, **4** | `q22` |
| 4 | `pdf/workshop-price-list-2026.pdf` | **No text layer.** The page is a single raster image with a seeded photocopier grain and a 0.45° skew. No `drawString` call is made on that page at all. | `PDFLoader` returns an empty string. Not an error, not a warning — a `Document` with no content, which is worse, because it indexes cleanly and simply never matches anything. The labour rate and every fixed-price job in the business are invisible to the pipeline until OCR is added. | **3** | `q23`, `q24` (both `requires_ocr: true`); `verify_corpus.py` asserts exactly one file extracts to nothing |
| 5 | `markdown/returns-and-refunds.md` · `html/faq.html` · `pdf/terms-of-sale-2026.pdf` · `markdown/staff-handbook/04-returns-desk.md` | **Near-duplicate passages.** The 30-day returns window is stated four times, in four registers: policy prose, customer FAQ voice, formal legal ("within thirty (30) days"), and internal procedure. | Four chunks compete for the same query. Dedup by exact hash catches none of them. A reranker has to choose, and a citation can end up pointing at the FAQ paraphrase when the authoritative source is the policy. | **4**, **9**, **11**, **12** | `q01` |
| 6 | `markdown/staff-handbook/04-returns-desk.md` (+ `pdf/terms-of-sale-2026.pdf` cl. 5.2) | **A discriminating detail present in only two of the four near-duplicates.** The window runs from the *carrier-recorded delivery date*, not the order date. The FAQ and the customer policy do not say this. | A pipeline that retrieves the FAQ chunk answers `q02` confidently and cannot support the answer from the passage it cited. This is the citation-support test in chapter 11: the claim is right, the citation does not contain it. | **9**, **11** | `q02` |
| 7 | `markdown/workshop-service-bulletins-2026.md` § 2026-04 | **The exact product code `BRK-1180`, appearing in exactly one document in the corpus.** The surrounding prose is about caliper mount adapters generally, and `markdown/superseded-parts-register.md` is a fourteen-row decoy of visually similar codes (`BRK-1170`, `BRK-1174`, `BRK-1188`, `ADP-3300`, `ADP-3308`) that dense retrieval prefers. | `q19` is the bare query `BRK-1180`. An embedding of a part number carries almost no signal, so dense retrieval returns the register and generic brake prose. BM25 hits the one document that contains the literal string. This is the motivation for hybrid search. | **8** | `q19`; `verify_corpus.py` asserts the code appears in exactly one document |
| 8 | `markdown/warranty-policy.md` § 5 | **A negation pair.** "Bare frames purchased from Braxby Cycles **are covered** by the crash-replacement scheme" and "Frames supplied as part of a complete bike **are not covered** by the crash-replacement scheme" — two sentences with near-identical embeddings and opposite meanings. | Retrieve the wrong one and the answer is confidently, precisely backwards. Cosine similarity cannot separate them; only reading them can. | **5**, **10** | `q11`, `q12` |
| 9 | `markdown/service-intervals.md` § Brakes | **A number-change pair.** "Hydraulic disc brakes should be bled every **12 months**" and "Hydraulic disc brakes used for wet-weather commuting should be bled every **6 months**", four lines apart, in the same section. | The two sentences differ by one qualifier and one digit and sit next to each other in embedding space. A pipeline that returns either one for both questions looks like it is working. | **5** | `q13`, `q14` |
| 10 | `markdown/service-intervals.md` § Frame | **A second number-change pair**, so the effect is not a one-off: headset service every 12 months, or every 6 months for winter riding. | Same failure, different section — useful as the held-out case when chapter 5's figure is built from the brake pair. | **5** | `q15` |
| 11 | `markdown/workshop-service-terms.md` § Customer-supplied parts | **A third negation pair, this one across two objects.** The workshop *will* fit customer-supplied tyres, tubes, saddles, seatposts, bar tape, pedals and cages; it *will not* fit customer-supplied pads, hoses, calipers, levers or rotors. Both sentences are restated in `html/workshop-booking.html`, so each has a near-duplicate as well. | The natural question — "will you fit parts I bought elsewhere?" — retrieves both halves and the answer depends on which one reaches the prompt. | **5**, **10** | `q17`, `q18` |
| 12 | `markdown/warranty-policy.md` §§ 1 and 6 | **A two-chunk answer.** Section 1 defines a workshop-laced wheel as a *workshop-built assembly*. Section 6, about 660 words later, gives workshop-built assemblies a 36-month term. Neither passage answers the question alone. | "How long is the warranty on a wheel your workshop built?" is answerable only when both chunks reach the prompt. Small chunks retrieve one or the other; the answer appears as chunk size grows, or when overlap or parent-document retrieval is added. This is the chapter-4 measurement. | **4** | `q09` (`requires_all: true`) |
| 13 | Corpus-wide | **Five questions whose answers are genuinely absent**: the VAT registration number, who founded the company, the weight of the `WHL-5120` wheelset, whether there is a cycle-to-work scheme, and whether the workshop opens on a bank holiday. Each has a *near-miss* context that invites invention — VAT is mentioned as included in prices; the overview gives a trading start year; the other two product pages both list a weight; opening hours are given by weekday and the 14 August closure is named. | Retrieval succeeds and returns a plausible, on-topic chunk. The answer is still not in it. This is the honest test of the answer contract: the pipeline must say it does not know rather than fill the gap. | **10** | `n01`–`n05`; `verify_corpus.py` asserts the forbidden phrases appear nowhere |
| 14 | `html/*.html` | **Boilerplate around the content.** Cookie banner, promo strip, eight-item nav, search form, breadcrumbs, sidebar, "customers also bought", reviews placeholder, newsletter form, three-column footer — identical on all five pages. | Index the whole page and every chunk carries "Free standard UK delivery on orders over £60" and the same twenty-five to thirty-four links. Five documents that should be distinct become five documents that look alike, and the boilerplate itself becomes retrievable. | **3** | Compare `q30` before and after selecting `main#content`. |
| 15 | `markdown/superseded-parts-register.md` · `markdown/warranty-policy.md` § 6 · `markdown/shipping-and-delivery.md` · `markdown/order-lifecycle-and-statuses.md` | **Markdown tables**, five of them, two to four columns wide and three to fourteen rows deep. A character splitter cuts them mid-row; a Markdown-aware splitter keeps them whole and blows the chunk budget on the 14-row register. | The chapter-4 splitting matrix has a real case to score: "how badly does each strategy fail on a table". | **4** | `q03`, `q07`, `q08`, `q16`, `q20` |
| 16 | `pdf/safety-recall-2025-11.pdf` · `markdown/superseded-parts-register.md` · `html/product-emberly-xr-wheelset.html` | **A superseded fact across three formats.** `WHL-5104` was recalled in November 2025 and replaced by `WHL-5120`. The recall PDF, the register row, and the product page each hold a different piece of that. | Freshness: a corpus where the newest document is not the only relevant one, and where deleting the old document would lose the recall. Also a second exact-code retrieval case with a serial range (`EX-24 0001` to `EX-24 4200`). | **8**, **13** | `q25` |

### Traps by chapter

- **Chapter 3 — Getting your documents in:** 1, 2, 3, 4, 14.
- **Chapter 4 — Chunking:** 3, 5, 12, 15.
- **Chapter 5 — Embeddings without the math:** 8, 9, 10, 11.
- **Chapter 8 — Search that actually finds it:** 7, 16.
- **Chapter 9 — Reranking:** 5, 6, 11.
- **Chapter 10 — The retrieval prompt:** 8, 11, 13.
- **Chapter 11 — Citations the reader can trust:** 5, 6.
- **Chapter 12 — Is it actually working?:** all of them, through `questions.jsonl`.
- **Chapter 13 — Keeping the index fresh:** 16.

---

## `questions.jsonl`

Thirty-five lines: **30 grounded questions with known answers, and 5 whose
answer is `null`** because the corpus does not contain one. This is the file
chapter 12 measures recall@k and MRR against.

One JSON object per line:

| Field | Type | Meaning |
|---|---|---|
| `id` | string | `q01`–`q30` for grounded, `n01`–`n05` for null. Stable — never renumber. |
| `question` | string | The query, phrased the way a user would type it. `q19` is deliberately the bare string `BRK-1180`. |
| `answer` | string \| null | The known answer, or `null` when the corpus does not contain one. |
| `answer_type` | `"grounded"` \| `"not_in_corpus"` | |
| `authoritative` | string \| null | The file a citation *should* point at when several files support the answer. Used by chapter 11, not by the recall scorer. |
| `supporting` | array | `{ file, key, passage }`. `file` is relative to `corpus/`. `passage` is the human-readable quote. `key` is the machine-checkable substring. |
| `requires_all` | boolean | `false` (default): any one supporting passage counts as a hit. `true`: **all** of them must be retrieved. Only `q09` sets this, and it is the chunk-size question. |
| `requires_ocr` | boolean | `true` when the answer exists only in the raster price list. Two questions (`q23`, `q24`). **Exclude these from the baseline recall figure unless the pipeline has an OCR step**, and say which you did. |
| `traps` | string[] | Which planted traps this question exercises. |
| `chapters` | number[] | Which chapters use it. |
| `note` | string | Present on the null questions, explaining the near-miss that invites invention. |

### The matching contract

A retrieved chunk **counts as correct for a question** when both hold:

1. its source metadata names a file listed in that question's `supporting`, and
2. its text contains that entry's `key`, after normalising whitespace and
   lowercasing.

`key` values are chosen to be short enough to survive a chunk boundary and free
of Markdown syntax, so the same key matches whether the loader kept the table
pipes or stripped them. `tools/verify_corpus.py` asserts every key is still
findable in its file.

**recall@k** is the fraction of grounded questions with at least one correct
chunk in the top *k*. **MRR** is the mean of `1 / rank` of the first correct
chunk, counting a question with no correct chunk in the top *k* as 0. For `q09`,
which sets `requires_all`, the rank used is the rank of the *later* of the two
required chunks.

The five null questions are **not** part of recall@k. They are scored
separately, as a refusal rate: the share of null questions the app answers with
"I don't know" rather than with a fabrication.

---

## Corpus canon

Facts the documents agree on. Anything added to this corpus later has to match
these, or the near-duplicate traps stop being near-duplicates and become
contradictions.

**The business.** Braxby Cycles Ltd, an online retailer of bicycle parts,
trading at `www.braxbycycles.example` since 2014. Two sites: the Manchester
workshop with a trade counter attached, and the goods-in and returns unit at
Marbury Trading Estate, Manchester. No shop floor. Four teams: Customer
Operations, Fulfilment, the Manchester workshop, Buying. The workshop closes on
**14 August** each year for stock-taking; online orders are unaffected. (That
closure is Book 1, chapter 6.)

**Hours.** Workshop and trade counter: Tuesday to Friday 09:00–17:30, Saturday
09:00–13:00, closed Sunday and Monday.

**House ranges and part-number prefixes.** Halvard — brakes, `BRK-`. Norbury —
drivetrain, `DRV-`. Emberly — wheels, `WHL-`. Wickhaven — frames and forks,
`FRM-`. Draycott — tyres, `TYR-`. Pellow — lights and accessories, `ACC-`.
Non-range adapters and fitting parts, `ADP-`.

**Shipping.** UK: £3.99 up to 2 kg, £6.99 over 2 kg to 10 kg, £11.99 over
10 kg; free over £60; next-day £7.99 before 14:00 Mon–Fri; Saturday £11.99.
Republic of Ireland £9.99. EU £14.99, delivered duty paid. Nowhere else. (The
three UK bands are Book 1, chapter 13.)

**Returns.** 30 days from the carrier-recorded delivery date, unfitted,
resaleable, original packaging. UK return postage free. Refund within five
working days of arrival. No exchanges. No restocking charge for consumers; 15%
on non-stock trade returns.

**Warranty.** Components 24 months. Wickhaven frames and rigid forks 60 months.
Workshop-built assemblies 36 months. Electronics 24 months. Consumables none.
Trade orders 12 months. Workshop labour guaranteed 12 months, except where the
customer supplied the part.

**Crash replacement.** Bare frames only, 40% off, within 36 months of the order
date. Not frames supplied inside a complete bike.

**Service intervals.** Hydraulic bleed 12 months, or 6 months for wet-weather
commuting. Chain replaced at 0.5% elongation, checked every 1,000 km. Wheel
true and tension every 2,000 km, first re-tension at 300 km. Headset 12 months,
or 6 months for winter riding.

**Workshop labour.** £58.00 per hour; full service £110.00. Those figures exist
**only** inside the raster price list.

---

## What is deliberately not here

- **No manuscript text.** This repo carries code and data. No chapter prose.
- **No real company, person, product, address or telephone number.** The one
  external-looking reference in the corpus is `braxbycycles.example`, on a
  reserved TLD that cannot resolve.
- **No third-party licensed content.** Every word is original and MIT-licensed
  with the repo.
- **No answer key inside the corpus.** `questions.jsonl` and this README are
  siblings of the corpus, not members of it. Do not index them.
- **No OCR output.** The price list stays a picture. Adding an OCR step is a
  reader exercise in chapter 3, and the ground truth for checking it is the
  `PRICE_LIST_LINES` table in `tools/build_pdfs.py`.
