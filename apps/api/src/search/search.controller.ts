import { Controller, Get, Query } from '@nestjs/common'
import { Public } from '../auth/public.decorator'
import { SearchService } from './search.service'

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  search(@Query('q') q: string, @Query('type') type?: string) {
    return this.searchService.search(q, type)
  }
}
