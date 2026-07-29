# fix(orders): round order totals consistently to cents

Totals computed from discounted line items can drift by a fraction of a cent; round once at the total.
