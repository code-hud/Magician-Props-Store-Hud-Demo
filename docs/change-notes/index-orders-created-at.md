# perf(db): add index on orders.created_at for recent-order queries

The recent-orders query scans the orders table; an index on created_at keeps it fast as history grows.
