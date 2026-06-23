import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { TravelerMailData } from '../mail/dto/mail.dto';

export interface ExcelPayload {
  cooperatorFullName: string;
  cooperatorEmail: string;
  cooperatorSchemeName: string;
  referenceNumber: string;
  submittedAt: Date;
  travelers: TravelerMailData[];
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  /**
   * Generates an Excel workbook buffer with two sheets:
   * Sheet 1 Cooperator Details
   * Sheet 2 Traveler Details (all travelers)
   */
  async generateRegistrationExcel(payload: ExcelPayload): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Leadway Travel Portal';
    workbook.created = new Date();

    this.buildCooperatorSheet(workbook, payload);
    this.buildTravelersSheet(workbook, payload);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Sheet 1: Cooperator Details

  private buildCooperatorSheet(workbook: ExcelJS.Workbook, payload: ExcelPayload): void {
    const sheet = workbook.addWorksheet('Cooperator Details');

    // Header row styling
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE65C00' }, // Leadway orange
    };
    const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

    sheet.columns = [
      { header: 'Field', key: 'field', width: 35 },
      { header: 'Value', key: 'value', width: 55 },
    ];

    // Style header row
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    // Data rows
    const rows = [
      { field: 'Reference Number',      value: payload.referenceNumber },
      { field: 'Full Name (Cooperator)', value: payload.cooperatorFullName },
      { field: 'Email Address',          value: payload.cooperatorEmail },
      { field: 'Cooperative Scheme Name', value: payload.cooperatorSchemeName },
      { field: 'Submitted At',           value: payload.submittedAt.toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }) },
    ];

    rows.forEach((row, i) => {
      const excelRow = sheet.addRow(row);
      if (i % 2 === 0) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
        });
      }
    });

    sheet.getColumn('field').font = { bold: true };
  }

  // Sheet 2: Traveler Details

  private buildTravelersSheet(workbook: ExcelJS.Workbook, payload: ExcelPayload): void {
    const sheet = workbook.addWorksheet('Traveler Details');

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE65C00' },
    };
    const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

    sheet.columns = [
      { header: 'Traveler',             key: 'traveler',    width: 20 },
      { header: 'Full Name',            key: 'fullName',    width: 35 },
      { header: 'Email Address',        key: 'email',       width: 35 },
      { header: 'Phone Number',         key: 'phone',       width: 20 },
      { header: 'Residential Address',  key: 'address',     width: 50 },
      { header: 'Travel Destination(s)', key: 'destinations', width: 35 },
      { header: 'Departure Date',       key: 'departure',   width: 18 },
      { header: 'Return Date',          key: 'return',      width: 18 },
      { header: 'Passport File',        key: 'passport',    width: 60 },
    ];

    // Style header row
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    // Data rows
    payload.travelers.forEach((traveler, i) => {
      const label = traveler.travelerIndex === 0
        ? 'Primary Traveler'
        : `Traveler ${traveler.travelerIndex + 1}`;

      const row = sheet.addRow({
        traveler:     label,
        fullName:     traveler.fullName,
        email:        traveler.email,
        phone:        traveler.phone,
        address:      traveler.residentialAddress,
        destinations: traveler.destinations.join(', '),
        departure:    traveler.departureDate,
        return:       traveler.returnDate,
        passport:     traveler.passportFileUrl,
      });

      // Alternate row shading
      if (i % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
        });
      }

      // Make passport URL a hyperlink
      const passportCell = row.getCell('passport');
      passportCell.value = {
        text: traveler.passportFileName,
        hyperlink: traveler.passportFileUrl,
      };
      passportCell.font = { color: { argb: 'FF0070C0' }, underline: true };
    });
  }
}