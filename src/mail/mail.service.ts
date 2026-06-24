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
const LEADWAY_TO = 'c-ogweh@leadway.com';
const LEADWAY_CC = 'j-okon@leadway.com';
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
 try {
      const info = await this.transporter.sendMail({
        from: `"Leadway Travel Portal" <${this.config.get('appConfig.smtpUsername')}>`,
        to: LEADWAY_TO,
        cc: LEADWAY_CC,
        bcc: LEADWAY_BCC,
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
 
      // Dev: Ethereal preview URL
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
          ...dto.travelers.map((traveler, index) => ({
            filename: `Traveler_${index + 1}_${traveler.fullName}_passport${traveler.passportFileExt}`,
            content: traveler.passportBuffer,
          })),
        ],
      });

      this.logger.log(
        `Leadway notification email sent. Ref: ${dto.referenceNumber} | messageId: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send Leadway notification email. Ref: ${dto.referenceNumber}`,
        error,
      );
    }
  }
}
