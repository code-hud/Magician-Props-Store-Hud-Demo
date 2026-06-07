export const ORDERS_CREATED_TOPIC = 'orders.created';

export const ORDERS_CREATED_GROUP = 'order-insights-consumer';

export interface OrderCreatedItem {
  productId: number;
  quantity: number;
  price: number;
}

export interface OrderCreatedEvent {
  orderId: number;
  sessionId: string;
  customerEmail: string;
  totalAmount: number;
  items: OrderCreatedItem[];
  createdAt: string;
}

export interface OrderInsights {
  orderId: number;
  expandedPropCount: number;
  bundleItemsProcessed: number;
  expandBundleCallCount: number;
  durationMs: number;
}
