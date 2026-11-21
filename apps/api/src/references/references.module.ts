import { Module } from '@nestjs/common'
import { LlmModule } from '../llm/llm.module'
import { ReferencesController } from './references.controller'
import { ReferencesService } from './references.service'

@Module({
  imports: [LlmModule],
  controllers: [ReferencesController],
  providers: [ReferencesService],
  exports: [ReferencesService],
})
export class ReferencesModule {}
