import { MicroserviceOptions, Transport } from '@nestjs/microservices';

export const KAFKA_EVENTS_GROUP = 'magician-props-events-consumer';

export function getKafkaMicroserviceOptions(): MicroserviceOptions | null {
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) {
    return null;
  }

  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'magician-props-events',
        brokers: brokers.split(',').map((b) => b.trim()),
      },
      consumer: {
        groupId: KAFKA_EVENTS_GROUP,
      },
      subscribe: {
        fromBeginning: false,
      },
    },
  };
}
