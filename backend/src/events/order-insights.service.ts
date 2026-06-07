import { Injectable } from '@nestjs/common';
import { BundleRepository } from '../products/repositories/bundle.repository';
import { ProductRepository } from '../products/repositories/product.repository';
import {
  OrderCreatedEvent,
  OrderCreatedItem,
  OrderInsights,
} from './order-events.types';

@Injectable()
export class OrderInsightsService {
  private expandBundleCallCount = 0;

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly bundleRepository: BundleRepository,
  ) {}

  async computeOrderInsights(event: OrderCreatedEvent): Promise<OrderInsights> {
    const startedAt = Date.now();
    this.expandBundleCallCount = 0;

    let expandedPropCount = 0;
    let bundleItemsProcessed = 0;

    for (const item of event.items) {
      if (!(await this.bundleRepository.hasComponents(item.productId))) {
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

    const componentIds = await this.bundleRepository.findComponentIds(productId);
    const expanded: OrderCreatedItem[] = [];

    for (const componentId of componentIds) {
      if (await this.bundleRepository.hasComponents(componentId)) {
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
