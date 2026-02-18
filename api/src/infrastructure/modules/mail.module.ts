import { Global, Module } from '@nestjs/common';
import { NodemailerMailService } from '../mail/nodemailer.mail.service';
import { MAIL_SERVICE_PORT } from '../../domain/ports';

@Global()
@Module({
  providers: [{ provide: MAIL_SERVICE_PORT, useClass: NodemailerMailService }],
  exports: [MAIL_SERVICE_PORT],
})
export class MailInfraModule {}
