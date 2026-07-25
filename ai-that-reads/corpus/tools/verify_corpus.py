#!/usr/bin/env python3
"""Check that the corpus still says what questions.jsonl claims it says.

Run this after editing any corpus file. It fails loudly rather than letting a
question quietly stop being answerable, which is the failure mode that would
silently corrupt every recall@k number in chapter 12.

What it checks:

1. Every ``supporting[].file`` exists.
2. Every ``supporting[].key`` appears in that file's extracted text, after
   whitespace normalisation. This is the matching contract the book's scorer
   uses: a retrieved chunk counts as correct when its source file matches and
   its text contains the key.
3. Questions marked ``requires_ocr`` are checked against the price-list source
   in ``build_pdfs.py``, because that content exists nowhere else as text.
4. Every ``answer_type: not_in_corpus`` question really is unanswerable — a
   list of forbidden phrases must not appear anywhere in the corpus.
5. The exact product code BRK-1180 appears in exactly one document.

    python3 -m venv .venv
    .venv/bin/pip install pypdf
    .venv/bin/python corpus/tools/verify_corpus.py
"""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

from pypdf import PdfReader

CORPUS = Path(__file__).resolve().parent.parent

# Phrases that must not appear anywhere, so that the null questions stay null.
FORBIDDEN = [
    "vat registration",
    "vat number",
    "cycle to work",
    "cycle-to-work",
    "salary sacrifice",
    "bank holiday",
    "founder",
    "founded by",
]


class VisibleText(HTMLParser):
    """Everything a reader would see, which is what a loader should give us."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in ("script", "style"):
            self._skip += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style"):
            self._skip = max(0, self._skip - 1)

    def handle_data(self, data: str) -> None:
        if not self._skip:
            self.parts.append(data)


def normalise(text: str) -> str:
    text = text.replace(" ", " ").replace("’", "'")
    text = text.replace("—", "-").replace("–", "-")
    return re.sub(r"\s+", " ", text).strip()


def extract(path: Path) -> str:
    if path.suffix == ".md":
        return normalise(path.read_text(encoding="utf-8"))
    if path.suffix == ".html":
        parser = VisibleText()
        parser.feed(path.read_text(encoding="utf-8"))
        return normalise(" ".join(parser.parts))
    if path.suffix == ".pdf":
        reader = PdfReader(str(path))
        return normalise("\n".join(page.extract_text() or "" for page in reader.pages))
    raise ValueError(f"unsupported file type: {path}")


def ocr_source_text() -> str:
    """The price-list content, read out of the generator that rasterised it."""
    source = (CORPUS / "tools" / "build_pdfs.py").read_text(encoding="utf-8")
    block = re.search(r"PRICE_LIST_LINES = \[(.*?)\n\]", source, re.S)
    if block is None:
        raise RuntimeError("PRICE_LIST_LINES not found in build_pdfs.py")
    return normalise(block.group(1).replace("|", " "))


def corpus_files() -> list[Path]:
    files: list[Path] = []
    for sub in ("markdown", "html", "pdf"):
        files.extend(sorted((CORPUS / sub).rglob("*")))
    return [f for f in files if f.is_file()]


def main() -> int:
    failures: list[str] = []

    texts = {f.relative_to(CORPUS).as_posix(): extract(f) for f in corpus_files()}
    ocr_text = ocr_source_text()

    questions = [
        json.loads(line)
        for line in (CORPUS / "questions.jsonl").read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]

    ids = [q["id"] for q in questions]
    if len(ids) != len(set(ids)):
        failures.append("duplicate question ids")

    grounded = [q for q in questions if q["answer_type"] == "grounded"]
    nulls = [q for q in questions if q["answer_type"] == "not_in_corpus"]
    print(f"{len(questions)} questions: {len(grounded)} grounded, {len(nulls)} null")

    for q in questions:
        if q["answer_type"] == "not_in_corpus":
            if q["answer"] is not None or q["supporting"]:
                failures.append(f"{q['id']}: null question must have no answer or support")
            continue
        if not q["supporting"]:
            failures.append(f"{q['id']}: grounded question with no supporting passage")
        for support in q["supporting"]:
            key = normalise(support["key"])
            if q.get("requires_ocr"):
                if key.lower() not in ocr_text.lower():
                    failures.append(f"{q['id']}: OCR key not in price-list source: {key!r}")
                continue
            text = texts.get(support["file"])
            if text is None:
                failures.append(f"{q['id']}: missing file {support['file']}")
                continue
            if key.lower() not in text.lower():
                failures.append(f"{q['id']}: key not found in {support['file']}: {key!r}")

    for phrase in FORBIDDEN:
        hits = [name for name, text in texts.items() if phrase in text.lower()]
        if hits:
            failures.append(f"forbidden phrase {phrase!r} appears in {hits}")

    code_hits = [name for name, text in texts.items() if "BRK-1180" in text]
    if code_hits != ["markdown/workshop-service-bulletins-2026.md"]:
        failures.append(f"BRK-1180 should appear in exactly one document, found {code_hits}")

    empty = [name for name, text in texts.items() if not text]
    if empty != ["pdf/workshop-price-list-2026.pdf"]:
        failures.append(f"exactly one file should extract to nothing, found {empty}")

    print(f"{len(texts)} documents checked")
    if failures:
        print("\nFAILED:")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print("OK - every planted fact is where questions.jsonl says it is")
    return 0


if __name__ == "__main__":
    sys.exit(main())
