# fix(cart): prevent negative quantities via API

Reject quantity updates below zero at the controller so the cart cannot hold negative line items.
