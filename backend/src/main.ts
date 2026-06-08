import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getKafkaMicroserviceOptions } from './events/kafka.config';
import { HudContextInterceptor } from './hud-context.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalInterceptors(new HudContextInterceptor());

  const kafkaOptions = getKafkaMicroserviceOptions();
  if (kafkaOptions) {
    app.connectMicroservice(kafkaOptions);
    await app.startAllMicroservices();
    console.log('[Kafka] Microservice consumer connected');
  } else {
    console.log('[Kafka] KAFKA_BROKERS unset — consumer disabled');
  }

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}
bootstrap();
