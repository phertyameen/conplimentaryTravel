import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TravelerDto } from './traveler.dto';

export class CreateRegistrationDto {
  // SECTION 1: COOPERATOR DETAILS

  @ApiProperty({ example: 'Adaeze Okonkwo', description: 'Full name as registered in the cooperative scheme' })
  @IsString()
  @IsNotEmpty({ message: 'Cooperator full name is NOT optional' })
  cooperatorFullName?: string;

  @ApiProperty({ example: 'adaeze.okonkwo@example.com' })
  @IsEmail({}, { message: 'A valid cooperator email address is required' })
  @IsNotEmpty({ message: 'Cooperator email address is NOT optional' })
  cooperatorEmail?: string;

  @ApiProperty({ example: 'Seplet Bank Staff Cooperative' })
  @IsString()
  @IsNotEmpty({ message: 'Cooperative scheme name is NOT optional' })
  cooperatorSchemeName?: string;

  // SECTION 2: TRAVELER DETAILS
  // Index 0 = primary traveler (always required)
  // Index 1–2 = additional travelers (optional, max 2)

  @ApiProperty({
    type: [TravelerDto],
    description: 'Array of travelers. Index 0 is the primary traveler (required). Up to 2 additional travelers allowed.',
    minItems: 1,
    maxItems: 3,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one traveler (primary) is required' })
  @ArrayMaxSize(3, { message: 'A maximum of 3 travelers (1 primary + 2 additional) is allowed' })
  @ValidateNested({ each: true })
  @Type(() => TravelerDto)
  travelers: TravelerDto[];
}