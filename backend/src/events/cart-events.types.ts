export const CART_ITEM_ADDED_TOPIC = 'cart.item_added';
export const CART_CLEARED_TOPIC = 'cart.cleared';

export interface CartItemAddedEvent {
  sessionId: string;
  productId: number;
  quantity: number;
  createdAt: string;
}

export interface CartClearedEvent {
  sessionId: string;
  itemCount: number;
  createdAt: string;
}
