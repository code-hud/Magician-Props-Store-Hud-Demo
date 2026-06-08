import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer, logLevel } from 'kafkajs';
import { CartClearedEvent, CartItemAddedEvent, CART_CLEARED_TOPIC, CART_ITEM_ADDED_TOPIC } from './cart-events.types';
import { serializeOrderCreatedEvent } from './order-events.codec';
import { OrderCreatedEvent, ORDERS_CREATED_TOPIC } from './order-events.types';

const PUBLISHED_TOPICS = [ORDERS_CREATED_TOPIC, CART_ITEM_ADDED_TOPIC, CART_CLEARED_TOPIC];

@Injectable()
export class KafkaEventsProducer implements OnModuleInit, OnModuleDestroy {
  private producer: Producer | null = null;

  async onModuleInit(): Promise<void> {
    const brokers = process.env.KAFKA_BROKERS;
    if (!brokers) {
      console.log('[KafkaEventsProducer] KAFKA_BROKERS unset — event publishing disabled');
      return;
    }

    const kafka = new Kafka({
      clientId: 'magician-props-api',
      brokers: brokers.split(',').map((b) => b.trim()),
      logLevel: logLevel.WARN,
    });

    this.producer = kafka.producer();
    await this.producer.connect();
    console.log(
      `[KafkaEventsProducer] Connected to Kafka (${brokers}), topics: ${PUBLISHED_TOPICS.join(', ')}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
    }
  }

  private publish(topic: string, key: string, value: string): void {
    if (!this.producer) {
      return;
    }

    void this.producer
      .send({
        topic,
        messages: [{ key, value }],
      })
      .catch((err) => {
        console.error(`[KafkaEventsProducer] Failed to publish to ${topic}:`, err);
      });
  }

  publishOrderCreated(event: OrderCreatedEvent): void {
    this.publish(ORDERS_CREATED_TOPIC, String(event.orderId), serializeOrderCreatedEvent(event));
  }

  publishCartItemAdded(event: CartItemAddedEvent): void {
    this.publish(CART_ITEM_ADDED_TOPIC, event.sessionId, JSON.stringify(event));
  }

  publishCartCleared(event: CartClearedEvent): void {
    this.publish(CART_CLEARED_TOPIC, event.sessionId, JSON.stringify(event));
  }
}
