---
name: PDF worker packaging
description: Why the server must preserve PDFJS runtime package assets.
---

Keep PDFJS external to the server bundle so its worker remains resolvable relative to the installed package.

**Why:** Bundling the library into a single server entry separates its relative worker reference from the worker asset. A valid resume can then fail before text extraction and appear to be an unreadable PDF.

**How to apply:** Preserve this constraint when changing server build tooling. Verify both a searchable PDF and an image-only PDF; the latter also exercises native canvas rendering and AI transcription.
