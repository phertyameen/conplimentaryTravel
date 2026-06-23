import { CooperatorConfirmationMailDto } from '../dto/mail.dto';

export function cooperatorConfirmationTemplate(data: CooperatorConfirmationMailDto): string {
  const travelerList = data.travelers
    .map((t) => {
      const label = t.travelerIndex === 0 ? 'Primary Traveler' : `Additional Traveler ${t.travelerIndex}`;
      return `<li>${label}: ${t.fullName}</li>`;
    })
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #E65C00; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">Leadway Assurance</h2>
      </div>

      <div style="padding: 30px 20px;">
        <p>Dear ${data.cooperatorFullName},</p>

        <p>
          Your Complimentary Travel Insurance registration has been submitted successfully for processing.
        </p>

        <p><strong>Reference Number:</strong> ${data.referenceNumber}</p>

        <p><strong>Registered Traveler(s):</strong></p>
        <ul>
          ${travelerList}
        </ul>

        <p>Thank you.</p>

        <p style="margin-top: 30px;">
          <strong>Leadway Assurance Company Limited</strong>
        </p>
      </div>

      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #999;">
        This is an automated message. Please do not reply to this email.
      </div>
    </div>
  `;
}