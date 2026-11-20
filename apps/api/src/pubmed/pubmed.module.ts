import { Module } from '@nestjs/common'
import { PubmedController } from './pubmed.controller'
import { PubmedService } from './pubmed.service'

@Module({
  controllers: [PubmedController],
  providers: [PubmedService],
  exports: [PubmedService],
})
export class PubmedModule {}
