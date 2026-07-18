import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Language } from '../../../common/enums/language.enum';

const CODE_MAX = 65536;
const STDIN_MAX = 65536;

export class SubmitCodeDto {
  @ApiProperty()
  @IsUUID()
  assignmentProblemId!: string;

  @ApiProperty({ enum: Language })
  @IsEnum(Language)
  language!: Language;

  @ApiProperty()
  @IsString()
  @MaxLength(CODE_MAX)
  userCode!: string;
}

export class SampleTestcaseDto {
  @ApiProperty()
  @IsString()
  @MaxLength(STDIN_MAX)
  input!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(STDIN_MAX)
  expected!: string;
}

export class RunCodeDto {
  @ApiProperty()
  @IsUUID()
  assignmentProblemId!: string;

  @ApiProperty({ enum: Language })
  @IsEnum(Language)
  language!: Language;

  @ApiProperty()
  @IsString()
  @MaxLength(CODE_MAX)
  userCode!: string;

  @ApiProperty({ type: [SampleTestcaseDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SampleTestcaseDto)
  sampleTestcases!: SampleTestcaseDto[];
}
