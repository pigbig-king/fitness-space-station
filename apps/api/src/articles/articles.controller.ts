import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { Public } from '../auth/public.decorator'
import { Roles } from '../auth/roles.decorator'
import { ArticlesService } from './articles.service'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Public()
  @Get()
  findAll() {
    return this.articlesService.findAll()
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateArticleDto) {
    return this.articlesService.create(dto)
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.articlesService.update(id, dto)
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id)
  }
}
