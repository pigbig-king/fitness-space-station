import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { CreateFavoriteListDto } from './dto/create-favorite-list.dto'
import { MoveFavoriteDto } from './dto/move-favorite.dto'
import { UpdateFavoriteListDto } from './dto/update-favorite-list.dto'
import { FavoriteListsService } from './favorite-lists.service'

@Controller()
export class FavoriteListsController {
  constructor(private readonly favoriteListsService: FavoriteListsService) {}

  @Get('favorite-lists')
  list(@CurrentUser() user: AuthUser) {
    return this.favoriteListsService.list(user.id)
  }

  @Post('favorite-lists')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFavoriteListDto) {
    return this.favoriteListsService.create(user.id, dto)
  }

  @Get('favorite-lists/:id')
  contents(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.favoriteListsService.contents(user.id, id)
  }

  @Patch('favorite-lists/:id')
  rename(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateFavoriteListDto) {
    return this.favoriteListsService.rename(user.id, id, dto)
  }

  @Delete('favorite-lists/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.favoriteListsService.remove(user.id, id)
  }

  @Post('favorites/:id/move')
  move(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: MoveFavoriteDto) {
    return this.favoriteListsService.move(user.id, id, dto)
  }
}
