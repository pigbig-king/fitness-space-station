import { Controller, Get, Query } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { FeedService } from './feed.service'

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  feed(@CurrentUser() user: AuthUser, @Query('page') page?: string) {
    return this.feedService.feed(user.id, page ? parseInt(page, 10) : 1)
  }
}
