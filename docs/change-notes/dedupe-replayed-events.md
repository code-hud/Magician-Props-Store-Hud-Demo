# fix(events): dedupe replayed order events by idempotency key

Consumer replays currently double-process orders; track idempotency keys to make handling replay-safe.
