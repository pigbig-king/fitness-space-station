import { Module } from '@nestjs/common'
import { LlmModule } from '../llm/llm.module'
import { ModerationService } from './moderation.service'

@Module({
  imports: [LlmModule],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
