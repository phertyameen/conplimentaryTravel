import { LeadwayNotificationMailDto, TravelerMailData } from '../dto/mail.dto';

function travelerTable(traveler: TravelerMailData): string {
  const label =
    traveler.travelerIndex === 0
      ? 'Primary Traveler'
      : `Traveler ${traveler.travelerIndex + 1}`;

  return `
    <h3 style="margin-top: 24px; color: #E65C00;">${label}: ${traveler.fullName}</h3>
    <table width="100%" cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse; border-color: #ddd; margin-bottom: 12px;">
      <tr style="background-color: #f9f9f9;">
        <td width="40%"><strong>Full Name</strong></td>
        <td>${traveler.fullName}</td>
      </tr>
      <tr>
        <td><strong>Email Address</strong></td>
        <td>${traveler.email}</td>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td><strong>Phone Number</strong></td>
        <td>${traveler.phone}</td>
      </tr>
      <tr>
        <td><strong>Residential Address</strong></td>
        <td>${traveler.residentialAddress}</td>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td><strong>Travel Destination(s)</strong></td>
        <td>${traveler.destinations.join(', ')}</td>
      </tr>
      <tr>
        <td><strong>Departure Date</strong></td>
        <td>${traveler.departureDate}</td>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td><strong>Return Date</strong></td>
        <td>${traveler.returnDate}</td>
      </tr>
      <tr>
        <td><strong>Passport Data Page</strong></td>
        <td>See attached file: ${traveler.passportFileName}</td>
      </tr>
    </table>
  `;
}

function attachmentsSection(travelers: TravelerMailData[]): string {
  const rows = travelers
    .map((t) => {
      const label =
        t.travelerIndex === 0
          ? 'Primary Traveler'
          : `Traveler ${t.travelerIndex + 1}`;
      const ext = t.passportFileName.split('.').pop()?.toUpperCase() ?? 'FILE';
      return `<li>${label} - ${t.fullName} - ${ext} - ${t.passportFileName} (attached)</li>`;
    })
    .join('');

  return `
    <h3 style="color: #E65C00;">Required Attachments</h3>
    <ul>${rows}</ul>
  `;
}

export function leadwayNotificationTemplate(
  data: LeadwayNotificationMailDto,
): string {
  const travelersHtml = data.travelers.map(travelerTable).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; color: #333;">
      <div style="background-color: #E65C00; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">Leadway Assurance - New Submission</h2>
      </div>

      <div style="padding: 30px 20px;">
        <p>Dear Team,</p>
        <p>
          A new complimentary travel insurance request has been submitted via the Travel Complimentary Portal.
        </p>
        <p><strong>Reference Number:</strong> ${data.referenceNumber}</p>
        <p><strong>Submitted At:</strong> ${data.submittedAt.toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</p>

        <hr style="border-color: #eee; margin: 20px 0;" />

        <h2 style="color: #E65C00;">Section 1: Cooperator Details</h2>
        <table width="100%" cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse; border-color: #ddd;">
          <tr style="background-color: #f9f9f9;">
            <td width="40%"><strong>Full Name</strong></td>
            <td>${data.cooperatorFullName}</td>
          </tr>
          <tr>
            <td><strong>Email Address</strong></td>
            <td>${data.cooperatorEmail}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td><strong>Cooperative Scheme Name</strong></td>
            <td>${data.cooperatorSchemeName}</td>
          </tr>
        </table>

        <hr style="border-color: #eee; margin: 20px 0;" />

        <h2 style="color: #E65C00;">Section 2: Traveler Details</h2>
        ${travelersHtml}

        <hr style="border-color: #eee; margin: 20px 0;" />

        ${attachmentsSection(data.travelers)}

        <p style="margin-top: 20px; font-size: 12px; color: #999;">
          An Excel sheet containing all submitted information is attached to this email.
        </p>
      </div>
    </div>
  `;
}
