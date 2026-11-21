import { Controller, Get } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { Public } from '../auth/public.decorator'
import { AchievementsService } from './achievements.service'

@Controller()
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Public()
  @Get('achievements')
  listAll() {
    return this.achievementsService.listAll()
  }

  @Get('users/me/achievements')
  listMine(@CurrentUser() user: AuthUser) {
    return this.achievementsService.listMine(user.id)
  }
}
