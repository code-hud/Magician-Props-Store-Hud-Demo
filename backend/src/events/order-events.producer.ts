import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer, logLevel } from 'kafkajs';
import { serializeOrderCreatedEvent } from './order-events.codec';
import { OrderCreatedEvent, ORDERS_CREATED_TOPIC } from './order-events.types';

@Injectable()
export class OrderEventsProducer implements OnModuleInit, OnModuleDestroy {
  private producer: Producer | null = null;

  async onModuleInit(): Promise<void> {
    const brokers = process.env.KAFKA_BROKERS;
    if (!brokers) {
      console.log('[OrderEventsProducer] KAFKA_BROKERS unset — orders.created publishing disabled');
      return;
    }

    const kafka = new Kafka({
      clientId: 'magician-props-api',
      brokers: brokers.split(',').map((b) => b.trim()),
      logLevel: logLevel.WARN,
    });

    this.producer = kafka.producer();
    await this.producer.connect();
    console.log(`[OrderEventsProducer] Connected to Kafka (${brokers}), topic: ${ORDERS_CREATED_TOPIC}`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
    }
  }

  publishOrderCreated(event: OrderCreatedEvent): void {
    if (!this.producer) {
      return;
    }

    void this.producer
      .send({
        topic: ORDERS_CREATED_TOPIC,
        messages: [
          {
            key: String(event.orderId),
            value: serializeOrderCreatedEvent(event),
          },
        ],
      })
      .catch((err) => {
        console.error(`[OrderEventsProducer] Failed to publish order ${event.orderId}:`, err);
      });
  }
}
