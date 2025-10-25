import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express'; // <-- Bunu import et
import { join } from 'path'; // <-- Node.js'in 'path' modülünü import et

async function bootstrap() {
  // 1. Tip olarak 'NestExpressApplication' kullan
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 2. Statik dosya sunumu için 'public' klasörünü ayarla
  // Bu, 'public' klasöründeki her şeyin dışarıya sunulmasını sağlar.
  // Örneğin, 'public/agents/resim.png' dosyasına '/agents/resim.png' URL'si ile erişilebilir.
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/', // İsteğe bağlı: URL'lerin başına bir ön-ek ekler (örn: '/static')
  });

  const config = new DocumentBuilder()
    .setTitle('Sui Credit System API')
    .setDescription('The Sui Credit System API description')
    .setVersion('1.0')
    .addTag('sui')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
