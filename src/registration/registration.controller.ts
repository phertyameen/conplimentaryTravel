import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@ApiTags('Registrations')
@Controller('registrations')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  /**
   * POST /api/registrations
   *
   * Accepts multipart/form-data with:
   * - JSON fields for cooperator and traveler details
   * - One passport file per traveler uploaded under the field name "passportFiles"
   *
   * File order must match traveler array order:
   * passportFiles[0] → travelers[0] (primary)
   * passportFiles[1] → travelers[1] (additional traveler 1)
   * passportFiles[2] → travelers[2] (additional traveler 2)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('passportFiles', 3), // max 3 files (1 primary + 2 additional)
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Submit travel insurance registration',
    description:
      'Submits a complete registration with cooperator details, up to 3 travelers, and one passport file per traveler. Returns a unique reference number on success.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'cooperatorFullName',
        'cooperatorEmail',
        'cooperatorSchemeName',
        'travelers',
      ],
      properties: {
        cooperatorFullName: { type: 'string', example: 'Adaeze Okonkwo' },
        cooperatorEmail: { type: 'string', example: 'adaeze@example.com' },
        cooperatorSchemeName: {
          type: 'string',
          example: 'Seplet Staff Cooperative',
        },
        travelers: {
          type: 'string',
          description: 'JSON-stringified array of traveler objects',
          example: JSON.stringify([
            {
              fullName: 'John Doe',
              email: 'john@example.com',
              phone: '+2348000000000',
              residentialAddress: '12 Broad St, Lagos',
              destinations: ['France', 'Germany'],
              departureDate: '2026-08-01',
              returnDate: '2026-08-15',
            },
          ]),
        },
        passportFiles: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            'Passport files in the same order as the travelers array. PDF, JPG, or PNG. Max 10MB each.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Registration submitted successfully.',
    schema: {
      example: {
        success: true,
        referenceNumber: 'CTS-20260622-A3F9',
        message:
          'Registration successful. A confirmation email has been sent to your email address.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - see errors array for details.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async create(
    @Body() body: any,
    @UploadedFiles() passportFiles: Express.Multer.File[],
  ) {
    // Parse travelers from JSON string (required because multipart/form-data
    // cannot send nested objects directly - frontend stringifies the array)
    let dto: CreateRegistrationDto;
    try {
      const parsed =
        typeof body.travelers === 'string'
          ? JSON.parse(body.travelers)
          : body.travelers;

      dto = {
        cooperatorFullName: body.cooperatorFullName,
        cooperatorEmail: body.cooperatorEmail,
        cooperatorSchemeName: body.cooperatorSchemeName,
        travelers: parsed,
      };
    } catch {
      throw new BadRequestException(
        'travelers field must be a valid JSON string.',
      );
    }

    if (!passportFiles || passportFiles.length === 0) {
      throw new BadRequestException('At least one passport file is required.');
    }

    const { referenceNumber } = await this.registrationService.create(
      dto,
      passportFiles,
    );

    return {
      success: true,
      referenceNumber,
      message:
        'Registration successful. A confirmation email has been sent to your email address.',
    };
  }
}
