import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsDateString,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class TravelerDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name as written in passport data page' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({ example: '+2348000000000' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[1-9]\d{6,14}$/, { message: 'A valid phone number is required' })
  phone: string;

  @ApiProperty({ example: '12 Broad Street, Lagos, Lagos State, Nigeria' })
  @IsString()
  @IsNotEmpty({ message: 'Residential address is required' })
  residentialAddress: string;

  @ApiProperty({
    example: ['France', 'Germany'],
    description: 'At least one travel destination country required',
    type: [String],
  })
  @IsArray({ message: 'Travel destinations must be an array' })
  @ArrayMinSize(1, { message: 'At least one travel destination is required' })
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  destinations: string[];

  @ApiProperty({ example: '2026-08-01', description: 'ISO date string — today or future date' })
  @IsDateString({}, { message: 'Departure date must be a valid date (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Departure date is required' })
  departureDate: string;

  @ApiProperty({ example: '2026-08-15', description: 'ISO date string — must be after departure date' })
  @IsDateString({}, { message: 'Return date must be a valid date (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Return date is required' })
  returnDate: string;

  // Passport file is handled separately via Multer — not part of JSON DTO
  // File URL is populated by the upload service before DB persistence
  @IsOptional()
  passportFileUrl?: string;
}