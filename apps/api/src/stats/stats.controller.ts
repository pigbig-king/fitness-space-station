import { Controller, Get, Query } from '@nestjs/common'
import { CurrentUser, CurrentUserOptional, type AuthUser } from '../auth/current-user.decorator'
import { Public } from '../auth/public.decorator'
import { StatsService } from './stats.service'

@Controller()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('users/me/streak')
  streak(@CurrentUser() user: AuthUser) {
    return this.statsService.streak(user.id)
  }

  @Public()
  @Get('leaderboard')
  leaderboard(@Query('type') type?: string, @CurrentUserOptional() viewer?: AuthUser | null) {
    return this.statsService.leaderboard(type ?? 'streak', viewer?.id)
  }
}
