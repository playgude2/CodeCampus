import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PlaygroundRunDto } from './dto/playground.dto';
import { PlaygroundResult, PlaygroundService } from './playground.service';

@ApiTags('playground')
@Controller('playground')
export class PlaygroundController {
  constructor(private readonly playground: PlaygroundService) {}

  @Public()
  @Post('run')
  @HttpCode(200)
  run(@Body() dto: PlaygroundRunDto): Promise<PlaygroundResult> {
    return this.playground.run(dto.language, dto.userCode, dto.stdin ?? '');
  }
}
