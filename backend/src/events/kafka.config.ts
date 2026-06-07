import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ORDERS_CREATED_GROUP } from './order-events.types';

export function getKafkaMicroserviceOptions(): MicroserviceOptions | null {
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) {
    return null;
  }

  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'magician-props-order-insights',
        brokers: brokers.split(',').map((b) => b.trim()),
      },
      consumer: {
        groupId: ORDERS_CREATED_GROUP,
      },
      subscribe: {
        fromBeginning: false,
      },
    },
  };
}
