import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { CurrentUser, CurrentUserOptional, type AuthUser } from '../auth/current-user.decorator'
import { OptionalAuthGuard } from '../auth/optional-auth.guard'
import { Public } from '../auth/public.decorator'
import { FollowService } from './follow.service'

@Controller()
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post('users/:id/follow')
  toggle(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.followService.toggle(user.id, id)
  }

  @Delete('users/:id/follow')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.followService.remove(user.id, id)
  }

  @Public()
  @Get('users/:id/followers')
  followers(@Param('id') id: string) {
    return this.followService.listFollowers(id)
  }

  @Public()
  @Get('users/:id/following')
  following(@Param('id') id: string) {
    return this.followService.listFollowing(id)
  }

  @Get('users/me/following')
  myFollowing(@CurrentUser() user: AuthUser) {
    return this.followService.listFollowing(user.id)
  }
}
