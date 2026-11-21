import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const userSelect = { id: true, email: true, nickname: true, avatarUrl: true }

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.comment.findMany({
      include: {
        user: { select: userSelect },
        video: { select: { id: true, title: true } },
        article: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  listByVideo(videoId: string, page = 1, pageSize = 20) {
    return this.list({ videoId }, page, pageSize)
  }

  listByArticle(articleId: string, page = 1, pageSize = 20) {
    return this.list({ articleId }, page, pageSize)
  }

  private async list(
    where: { videoId?: string; articleId?: string },
    page: number,
    pageSize: number,
  ) {
    const topWhere = { ...where, parentId: null }
    const [total, items] = await Promise.all([
      this.prisma.comment.count({ where: topWhere }),
      this.prisma.comment.findMany({
        where: topWhere,
        include: {
          user: { select: userSelect },
          replies: {
            include: { user: { select: userSelect } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
    return { total, page, pageSize, items }
  }

  createVideo(userId: string, videoId: string, content: string, parentId?: string) {
    return this.prisma.comment.create({ data: { userId, videoId, content, parentId } })
  }

  createArticle(userId: string, articleId: string, content: string, parentId?: string) {
    return this.prisma.comment.create({ data: { userId, articleId, content, parentId } })
  }

  async remove(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } })
    if (!comment) throw new NotFoundException('评论不存在')
    return this.prisma.comment.delete({ where: { id } })
  }
}
