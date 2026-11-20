import { Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { FavoritesService } from './favorites.service'

@Controller()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('videos/:id/favorite')
  toggleVideo(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.favoritesService.toggleVideo(user.id, id)
  }

  @Delete('videos/:id/favorite')
  removeVideo(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.favoritesService.removeVideo(user.id, id)
  }

  @Post('articles/:id/favorite')
  toggleArticle(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.favoritesService.toggleArticle(user.id, id)
  }

  @Delete('articles/:id/favorite')
  removeArticle(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.favoritesService.removeArticle(user.id, id)
  }

  @Get('users/me/favorites')
  listMine(@CurrentUser() user: AuthUser) {
    return this.favoritesService.listMine(user.id)
  }
}
