import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../products/repositories/product.repository';
import { BUNDLE_GRAPH, isBundleProduct } from './bundle-graph.constant';
import {
  OrderCreatedEvent,
  OrderCreatedItem,
  OrderInsights,
} from './order-events.types';

@Injectable()
export class OrderInsightsService {
  private expandBundleCallCount = 0;

  constructor(private readonly productRepository: ProductRepository) {}

  async computeOrderInsights(event: OrderCreatedEvent): Promise<OrderInsights> {
    const startedAt = Date.now();
    this.expandBundleCallCount = 0;

    let expandedPropCount = 0;
    let bundleItemsProcessed = 0;

    for (const item of event.items) {
      if (!isBundleProduct(item.productId)) {
        continue;
      }

      bundleItemsProcessed += item.quantity;
      const props = await this.expandBundle(item.productId);
      expandedPropCount += props.length * item.quantity;
    }

    const durationMs = Date.now() - startedAt;

    console.log(
      `[OrderInsights] processed order ${event.orderId} ok — ` +
        `${expandedPropCount} props from ${bundleItemsProcessed} bundle line(s) in ${durationMs}ms`,
    );

    return {
      orderId: event.orderId,
      expandedPropCount,
      bundleItemsProcessed,
      expandBundleCallCount: this.expandBundleCallCount,
      durationMs,
    };
  }

  async expandBundle(productId: number): Promise<OrderCreatedItem[]> {
    this.expandBundleCallCount += 1;

    await this.productRepository.findById(productId);

    const components = BUNDLE_GRAPH[productId];
    if (!components) {
      return [];
    }

    const expanded: OrderCreatedItem[] = [];

    for (const componentId of components) {
      if (isBundleProduct(componentId)) {
        const nested = await this.expandBundle(componentId);
        expanded.push(...nested);
      } else {
        await this.productRepository.findById(componentId);
        expanded.push({ productId: componentId, quantity: 1, price: 0 });
      }
    }

    return expanded;
  }
}
