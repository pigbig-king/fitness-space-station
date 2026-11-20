import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { Public } from '../auth/public.decorator'
import { Roles } from '../auth/roles.decorator'
import { CommentsService } from './comments.service'
import { CreateCommentDto } from './dto/create-comment.dto'

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get('videos/:id/comments')
  listByVideo(@Param('id') id: string) {
    return this.commentsService.listByVideo(id)
  }

  @Post('videos/:id/comments')
  createVideo(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.createVideo(user.id, id, dto.content)
  }

  @Public()
  @Get('articles/:id/comments')
  listByArticle(@Param('id') id: string) {
    return this.commentsService.listByArticle(id)
  }

  @Post('articles/:id/comments')
  createArticle(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.createArticle(user.id, id, dto.content)
  }

  @Roles('ADMIN')
  @Delete('comments/:id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id)
  }
}
