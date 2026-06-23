import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationEntity } from './entities/registration.entity';
import { TravelerEntity } from './entities/traveler.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { generateReferenceNumber } from '../common/utils/reference-number.helper';
import { UploadService } from '../upload/upload.service';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service';
import { ExportService } from '../export/export.service';
import { TravelerMailData } from '../mail/dto/mail.dto';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    @InjectRepository(RegistrationEntity)
    private readonly registrationRepo: Repository<RegistrationEntity>,

    @InjectRepository(TravelerEntity)
    private readonly travelerRepo: Repository<TravelerEntity>,

    private readonly uploadService: UploadService,
    private readonly storageService: StorageService,
    private readonly mailService: MailService,
    private readonly exportService: ExportService,
  ) {}

  async create(
    dto: CreateRegistrationDto,
    passportFiles: Express.Multer.File[],
  ): Promise<{ referenceNumber: string }> {
    // 1. Validate traveler count vs uploaded files
    if (passportFiles.length !== dto.travelers.length) {
      throw new BadRequestException(
        `Expected ${dto.travelers.length} passport file(s), received ${passportFiles.length}.`,
      );
    }

    // 2. Validate date logic for each traveler
    this.validateTravelerDates(dto);

    // 3. Validate & store all passport files
    try {
      this.uploadService.validateMany(passportFiles);
    } catch (error) {
      throw error;
    }

    // 4. Generate unique reference number
    const referenceNumber = await this.generateUniqueReference();

    // 5. Persist registration and travelers
    let savedRegistration: RegistrationEntity;
    try {
      const registration = this.registrationRepo.create({
        referenceNumber,
        cooperatorFullName: dto.cooperatorFullName,
        cooperatorEmail: dto.cooperatorEmail,
        cooperatorSchemeName: dto.cooperatorSchemeName,
      });

      const travelers: TravelerEntity[] = dto.travelers.map(
        (travelerDto, index) => {
          const traveler = this.travelerRepo.create({
            travelerIndex: index,
            fullName: travelerDto.fullName,
            email: travelerDto.email,
            phone: travelerDto.phone,
            residentialAddress: travelerDto.residentialAddress,
            destinations: JSON.stringify(travelerDto.destinations),
            departureDate: travelerDto.departureDate,
            returnDate: travelerDto.returnDate,
            passportFileName: passportFiles[index].originalname,
          });
          return traveler;
        },
      );

      registration.travelers = travelers;
      savedRegistration = await this.registrationRepo.save(registration);
    } catch (error) {
      this.logger.error('DB save failed', error);
      throw new InternalServerErrorException(
        'Registration could not be saved. Please try again.',
      );
    }

    // ── 6. Build traveler mail data ───────────────────────────────────────
    const travelerMailData: TravelerMailData[] =
      savedRegistration.travelers.map((t, index) => ({
        travelerIndex: t.travelerIndex,
        fullName: t.fullName,
        email: t.email,
        phone: t.phone,
        residentialAddress: t.residentialAddress,
        destinations: JSON.parse(t.destinations),
        departureDate: t.departureDate,
        returnDate: t.returnDate,
        passportFileName: t.passportFileName,
        passportFileExt: passportFiles[index].originalname.substring(
          passportFiles[index].originalname.lastIndexOf('.'),
        ),
        passportBuffer: passportFiles[index].buffer,
      }));

    // ── 7. Generate Excel attachment ──────────────────────────────────────
    const excelBuffer = await this.exportService.generateRegistrationExcel({
      cooperatorFullName: savedRegistration.cooperatorFullName,
      cooperatorEmail: savedRegistration.cooperatorEmail,
      cooperatorSchemeName: savedRegistration.cooperatorSchemeName,
      referenceNumber: savedRegistration.referenceNumber,
      submittedAt: savedRegistration.submittedAt,
      travelers: travelerMailData,
    });

    const excelFileName = `Registration-${referenceNumber}.xlsx`;

    // 8. Send emails (non-blocking - DB record already safe)
    await Promise.allSettled([
      // FRD 3: Cooperator confirmation
      this.mailService.sendCooperatorConfirmation({
        cooperatorFullName: savedRegistration.cooperatorFullName,
        cooperatorEmail: savedRegistration.cooperatorEmail,
        cooperatorSchemeName: savedRegistration.cooperatorSchemeName,
        referenceNumber: savedRegistration.referenceNumber,
        travelers: travelerMailData.map((t) => ({
          travelerIndex: t.travelerIndex,
          fullName: t.fullName,
        })),
        submittedAt: savedRegistration.submittedAt,
      }),

      // FRD 4: Leadway internal notification
      this.mailService.sendLeadwayNotification({
        cooperatorFullName: savedRegistration.cooperatorFullName,
        cooperatorEmail: savedRegistration.cooperatorEmail,
        cooperatorSchemeName: savedRegistration.cooperatorSchemeName,
        referenceNumber: savedRegistration.referenceNumber,
        travelers: travelerMailData,
        submittedAt: savedRegistration.submittedAt,
        excelAttachmentBuffer: excelBuffer,
        excelAttachmentFileName: excelFileName,
      }),
    ]);

    // 9. Return success response
    return { referenceNumber: savedRegistration.referenceNumber };
  }

  // Private Helpers

  private validateTravelerDates(dto: CreateRegistrationDto): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    dto.travelers.forEach((traveler, index) => {
      const label = index === 0 ? 'Primary Traveler' : `Traveler ${index + 1}`;
      const departure = new Date(traveler.departureDate);
      const returnDate = new Date(traveler.returnDate);

      if (departure < today) {
        throw new BadRequestException(
          `${label}: Departure date must be today or a future date.`,
        );
      }

      if (returnDate <= departure) {
        throw new BadRequestException(
          `${label}: Return date must be after the departure date.`,
        );
      }
    });
  }

  private async generateUniqueReference(): Promise<string> {
    // Retry up to 5 times on collision (extremely rare with 36^4 = 1.6M combinations per day)
    for (let attempt = 0; attempt < 5; attempt++) {
      const ref = generateReferenceNumber();
      const exists = await this.registrationRepo.findOne({
        where: { referenceNumber: ref },
      });
      if (!exists) return ref;
    }
    throw new InternalServerErrorException(
      'Could not generate a unique reference number. Please try again.',
    );
  }
}
