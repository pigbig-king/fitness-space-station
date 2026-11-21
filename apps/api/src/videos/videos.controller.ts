import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUserOptional, type AuthUser } from '../auth/current-user.decorator'
import { OptionalAuthGuard } from '../auth/optional-auth.guard'
import { Public } from '../auth/public.decorator'
import { Roles } from '../auth/roles.decorator'
import { CreateVideoDto } from './dto/create-video.dto'
import { UpdateVideoDto } from './dto/update-video.dto'
import { VideosService } from './videos.service'

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Public()
  @UseGuards(OptionalAuthGuard)
  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @CurrentUserOptional() viewer?: AuthUser | null,
  ) {
    return this.videosService.findAll(
      {
        q,
        category,
        page: page ? parseInt(page, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      },
      viewer ?? null,
    )
  }

  @Public()
  @UseGuards(OptionalAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUserOptional() viewer: AuthUser | null) {
    return this.videosService.findOne(id, viewer)
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateVideoDto) {
    return this.videosService.create(dto)
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.videosService.update(id, dto)
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.videosService.remove(id)
  }
}
