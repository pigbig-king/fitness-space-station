import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ModerationService } from '../moderation/moderation.service'
import { NotificationsService } from '../notifications/notifications.service'
import { PrismaService } from '../prisma/prisma.service'

const userSelect = { id: true, email: true, nickname: true, avatarUrl: true }

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly moderation: ModerationService,
  ) {}

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

  async createVideo(userId: string, videoId: string, content: string, parentId?: string) {
    this.assertClean(content)
    const comment = await this.prisma.comment.create({
      data: { userId, videoId, content, parentId },
    })
    if (parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: parentId } })
      if (parent) void this.notifications.notify(parent.userId, 'reply', userId, 'comment', comment.id)
    }
    return comment
  }

  async createArticle(userId: string, articleId: string, content: string, parentId?: string) {
    this.assertClean(content)
    const comment = await this.prisma.comment.create({
      data: { userId, articleId, content, parentId },
    })
    if (parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: parentId } })
      if (parent) void this.notifications.notify(parent.userId, 'reply', userId, 'comment', comment.id)
    } else {
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: { authorId: true },
      })
      if (article) void this.notifications.notify(article.authorId, 'comment', userId, 'article', articleId)
    }
    return comment
  }

  async remove(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } })
    if (!comment) throw new NotFoundException('评论不存在')
    return this.prisma.comment.delete({ where: { id } })
  }

  private assertClean(content: string) {
    const hit = this.moderation.containsSensitive(content)
    if (hit.length > 0) {
      throw new BadRequestException('评论含敏感词，无法发布')
    }
  }
}
