import { Controller, Get, Param } from '@nestjs/common'
import { Public } from '../auth/public.decorator'
import { TagsService } from './tags.service'

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Public()
  @Get(':name')
  listArticlesByTag(@Param('name') name: string) {
    return this.tagsService.listArticlesByTag(name)
  }
}
