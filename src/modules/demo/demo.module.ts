import { Body, Controller, HttpCode, Injectable, Module, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { Repository } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';
import { DemoRequest } from './entities/demo-request.entity';

export class CreateDemoRequestDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  fullName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;
}

@Injectable()
export class DemoService {
  constructor(
    @InjectRepository(DemoRequest) private readonly demoRequests: Repository<DemoRequest>,
  ) {}

  create(dto: CreateDemoRequestDto): Promise<DemoRequest> {
    // Email notifications (team + confirmation) are wired via the mailer in prod;
    // here we persist the lead.
    return this.demoRequests.save(
      this.demoRequests.create({
        fullName: dto.fullName,
        email: dto.email,
        phoneNumber: dto.phoneNumber ?? null,
      }),
    );
  }
}

@ApiTags('demo')
@Controller('demo-requests')
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Public()
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateDemoRequestDto): Promise<{ id: string; message: string }> {
    const request = await this.demo.create(dto);
    return { id: request.id, message: 'Demo request received' };
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([DemoRequest])],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
