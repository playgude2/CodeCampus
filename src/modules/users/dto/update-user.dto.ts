import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/** All fields optional; password re-hashed only if provided. */
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, [] as const)) {}
