import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import {
  CooperatorConfirmationMailDto,
  LeadwayNotificationMailDto,
} from './dto/mail.dto';
import { cooperatorConfirmationTemplate } from './templates/cooperator-confirmation.template';
import { leadwayNotificationTemplate } from './templates/leadway-notification.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  private get leadwayTo(): string {
    return this.config.get<string>('appConfig.leadwayTo') || '';
  }
  private get leadwayCC(): string {
    return this.config.get<string>('appConfig.leadwayCC') || '';
  }
  private get leadwayBCC(): string {
    return this.config.get<string>('appConfig.leadwayBCC') || '';
  }

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

      this.logger.log(
        `Cooperator email sent to ${dto.cooperatorEmail} | messageId: ${info.messageId}`,
      );

      // dev: email preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`Cooperator email preview: ${previewUrl}`);
      }
    } catch (error) {
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

    if (!this.leadwayTo) {
      this.logger.error(
        `LEADWAY_TO is not set — Leadway notification skipped. Ref: ${dto.referenceNumber}`,
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Leadway Travel Portal" <${this.config.get('appConfig.smtpUsername')}>`,
        to: this.leadwayTo,
        cc: this.leadwayCC || undefined,
        bcc: this.leadwayBCC || undefined,
        subject,
        html: leadwayNotificationTemplate(dto),
        attachments: [
          // Excel sheet
          {
            filename: dto.excelAttachmentFileName,
            content: dto.excelAttachmentBuffer,
            contentType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
          // Passport files — one per traveler
          ...dto.travelers.map((traveler, index) => ({
            filename: `Traveler_${index + 1}_${traveler.fullName.replace(/\s+/g, '_')}_passport${traveler.passportFileExt}`,
            content: traveler.passportBuffer,
          })),
        ],
      });

      this.logger.log(
        `Leadway notification sent. Ref: ${dto.referenceNumber} | messageId: ${info.messageId}`,
      );

      // Dev: smtp preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`Leadway email preview: ${previewUrl}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send Leadway notification. Ref: ${dto.referenceNumber}`,
        error,
      );
    }
  }
}
