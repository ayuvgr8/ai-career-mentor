---
name: Landing geometry checks
description: Why mobile hero containment must account for scrollbars and transformed bounds.
---

Check the fan against the panel's available content width, including rotated corners and hover scale, not only the requested browser viewport width.

**Why:** A browser acceptance run at a 390px viewport had only 375px of document width because of its scrollbar. A fan that appeared contained in the screenshot browser extended beyond the panel in that browser.

**How to apply:** Leave horizontal clearance for a conventional scrollbar and inspect transformed bounds when changing card size, spacing, rotation, or hover scale. Keep lower-half cloud masking separate from horizontal containment.
