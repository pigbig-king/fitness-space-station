import { Controller, Get } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { Public } from '../auth/public.decorator'
import { RecommendService } from './recommend.service'

@Controller('recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendService) {}

  @Public()
  @Get('hot')
  hot() {
    return this.recommendService.hot()
  }

  @Get('for-you')
  forYou(@CurrentUser() user: AuthUser) {
    return this.recommendService.forYou(user.id)
  }
}
