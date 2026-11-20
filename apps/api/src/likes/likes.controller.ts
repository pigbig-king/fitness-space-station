import { Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { LikesService } from './likes.service'

@Controller()
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('videos/:id/like')
  toggleVideo(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.likesService.toggleVideo(user.id, id)
  }

  @Delete('videos/:id/like')
  removeVideo(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.likesService.removeVideo(user.id, id)
  }

  @Post('articles/:id/like')
  toggleArticle(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.likesService.toggleArticle(user.id, id)
  }

  @Delete('articles/:id/like')
  removeArticle(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.likesService.removeArticle(user.id, id)
  }

  @Get('users/me/likes')
  listMine(@CurrentUser() user: AuthUser) {
    return this.likesService.listMine(user.id)
  }
}
