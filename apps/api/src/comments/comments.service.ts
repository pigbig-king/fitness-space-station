import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.comment.findMany({
      include: {
        user: { select: { id: true, email: true, nickname: true, avatarUrl: true } },
        video: { select: { id: true, title: true } },
        article: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  listByVideo(videoId: string) {
    return this.prisma.comment.findMany({
      where: { videoId },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  listByArticle(articleId: string) {
    return this.prisma.comment.findMany({
      where: { articleId },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  createVideo(userId: string, videoId: string, content: string) {
    return this.prisma.comment.create({ data: { userId, videoId, content } })
  }

  createArticle(userId: string, articleId: string, content: string) {
    return this.prisma.comment.create({ data: { userId, articleId, content } })
  }

  async remove(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } })
    if (!comment) throw new NotFoundException('评论不存在')
    return this.prisma.comment.delete({ where: { id } })
  }
}
