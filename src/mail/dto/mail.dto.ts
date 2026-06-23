export interface TravelerMailData {
  travelerIndex: number;       // 0 = Primary, 1+ = Additional
  fullName: string;
  email: string;
  phone: string;
  residentialAddress: string;
  destinations: string[];
  departureDate: string;
  returnDate: string;
  passportFileUrl?: string;
  passportFileName: string;
  passportFileExt: string;
  passportBuffer: Buffer;
}

export interface CooperatorConfirmationMailDto {
  cooperatorFullName: string;
  cooperatorEmail: string;
  cooperatorSchemeName: string;
  referenceNumber: string;
  travelers: Pick<TravelerMailData, 'fullName' | 'travelerIndex'>[];
  submittedAt: Date;
}

export interface LeadwayNotificationMailDto {
  cooperatorFullName: string;
  cooperatorEmail: string;
  cooperatorSchemeName: string;
  referenceNumber: string;
  travelers: TravelerMailData[];
  submittedAt: Date;
  excelAttachmentBuffer: Buffer;
  excelAttachmentFileName: string;
}