import { Controller, Get, Query } from '@nestjs/common'
import { Public } from '../auth/public.decorator'
import { PubmedService } from './pubmed.service'

@Controller('pubmed')
export class PubmedController {
  constructor(private readonly pubmedService: PubmedService) {}

  @Public()
  @Get('search')
  search(@Query('q') q: string) {
    return this.pubmedService.search(q)
  }
}
