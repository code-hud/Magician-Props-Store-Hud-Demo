# fix(orders): retry order-event publish on transient Kafka errors

Wrap the order-created event publish in a bounded retry so transient broker hiccups do not drop fulfillment events.
