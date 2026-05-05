import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HudContextInterceptor } from './hud-context.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalInterceptors(new HudContextInterceptor());

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}
bootstrap();
