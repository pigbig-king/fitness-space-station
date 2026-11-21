import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { CurrentUser, CurrentUserOptional, type AuthUser } from '../auth/current-user.decorator'
import { OptionalAuthGuard } from '../auth/optional-auth.guard'
import { Public } from '../auth/public.decorator'
import { ArticlesService } from './articles.service'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Public()
  @UseGuards(OptionalAuthGuard)
  @Get()
  findAll(@CurrentUserOptional() viewer: AuthUser | null) {
    return this.articlesService.findAll(viewer)
  }

  @Public()
  @UseGuards(OptionalAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUserOptional() viewer: AuthUser | null) {
    return this.articlesService.findOne(id, viewer)
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateArticleDto) {
    return this.articlesService.create(dto, user)
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateArticleDto) {
    return this.articlesService.update(id, dto, user)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.articlesService.remove(id, user)
  }
}
