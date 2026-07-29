# perf(products): cache best-selling props list for 60 seconds

The best-sellers rail is recomputed on every request; cache it briefly to cut repeated aggregate queries.
