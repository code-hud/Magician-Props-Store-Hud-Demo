# fix(pagination): keep page in range when filters shrink results

Applying a filter while on page 9 of 3 leaves the grid empty; clamp the current page to the new page count.
