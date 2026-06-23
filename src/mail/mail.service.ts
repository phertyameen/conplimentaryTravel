import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import {
  CooperatorConfirmationMailDto,
  LeadwayNotificationMailDto,
} from './dto/mail.dto';
import { cooperatorConfirmationTemplate } from './templates/cooperator-confirmation.template';
import { leadwayNotificationTemplate } from './templates/leadway-notification.template';

// recipient list
const LEADWAY_TO = 'f-aminu@leadway.com';
const LEADWAY_CC = 'b-simon@leadway.com';
const LEADWAY_BCC = 'i-popoola@leadway.com, e-muhammed@leadway.com';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('appConfig.mailHost'),
      port: this.config.get<number>('appConfig.mailPort'),
      secure: this.config.get<boolean>('appConfig.mailSecure'),
      auth: {
        user: this.config.get<string>('appConfig.smtpUsername'),
        pass: this.config.get<string>('appConfig.smtpPassword'),
      },
    });
  }

  /**
   * Sends confirmation email to the cooperator immediately after
   * successful form submission.
   */
  async sendCooperatorConfirmation(
    dto: CooperatorConfirmationMailDto,
  ): Promise<void> {
    const subject = `Complimentary Travel Insurance Registration Successful - Ref: ${dto.referenceNumber}`;

    try {
      const info = await this.transporter.sendMail({
        from: `"Leadway Assurance" <${this.config.get('appConfig.smtpUsername')}>`,
        to: dto.cooperatorEmail,
        subject,
        html: cooperatorConfirmationTemplate(dto),
      });

      this.logger.log(`Cooperator confirmation email sent to ${dto.cooperatorEmail} | messageId: ${info.messageId}`);
    } catch (error) {
      // Non-fatal: DB record already saved; log and continue
      this.logger.error(
        `Failed to send cooperator confirmation email to ${dto.cooperatorEmail}`,
        error,
      );
    }
  }

  /**
   * - Sends internal notification email to Leadway team with:
   * - Full cooperator and traveler details in HTML tables
   * - Passport file links
   * - Excel sheet attached
   */
  async sendLeadwayNotification(
    dto: LeadwayNotificationMailDto,
  ): Promise<void> {
    const subject = `New Submission - ${dto.cooperatorSchemeName} ${dto.cooperatorFullName} - Ref: ${dto.referenceNumber}`;

    try {
      const info = await this.transporter.sendMail({
        from: `"Leadway Travel Portal" <${this.config.get('appConfig.smtpUsername')}>`,
        to: LEADWAY_TO,
        cc: LEADWAY_CC,
        bcc: LEADWAY_BCC,
        subject,
        html: leadwayNotificationTemplate(dto),
        attachments: [
          {
            filename: dto.excelAttachmentFileName,
            content: dto.excelAttachmentBuffer,
            contentType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      });

      this.logger.log(`Leadway notification email sent. Ref: ${dto.referenceNumber} | messageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send Leadway notification email. Ref: ${dto.referenceNumber}`,
        error,
      );
    }
  }
}