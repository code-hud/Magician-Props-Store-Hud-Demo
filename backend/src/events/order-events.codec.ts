import { OrderCreatedEvent, OrderCreatedItem } from './order-events.types';

export interface OrderCreatedEventWire {
  orderId: number;
  sessionId: string;
  customerEmail: string;
  totalAmount: number;
  items: string;
  createdAt: string;
}

export function serializeOrderCreatedEvent(event: OrderCreatedEvent): string {
  const wire: OrderCreatedEventWire = {
    orderId: event.orderId,
    sessionId: event.sessionId,
    customerEmail: event.customerEmail,
    totalAmount: event.totalAmount,
    items: JSON.stringify(event.items),
    createdAt: event.createdAt,
  };

  return JSON.stringify(wire);
}

export function deserializeOrderCreatedEvent(payload: OrderCreatedEventWire): OrderCreatedEvent {
  const items = JSON.parse(payload.items) as OrderCreatedItem[];

  return {
    orderId: payload.orderId,
    sessionId: payload.sessionId,
    customerEmail: payload.customerEmail,
    totalAmount: payload.totalAmount,
    items,
    createdAt: payload.createdAt,
  };
}
