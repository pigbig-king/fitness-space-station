import { Injectable } from '@nestjs/common'
import { NotificationsService } from '../notifications/notifications.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async toggleVideo(userId: string, videoId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_videoId: { userId, videoId } },
    })
    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } })
    } else {
      await this.prisma.like.create({ data: { userId, videoId } })
    }
    const count = await this.prisma.like.count({ where: { videoId } })
    return { liked: !existing, count }
  }

  async removeVideo(userId: string, videoId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_videoId: { userId, videoId } },
    })
    if (existing) await this.prisma.like.delete({ where: { id: existing.id } })
    const count = await this.prisma.like.count({ where: { videoId } })
    return { liked: false, count }
  }

  async toggleArticle(userId: string, articleId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_articleId: { userId, articleId } },
    })
    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } })
    } else {
      await this.prisma.like.create({ data: { userId, articleId } })
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: { authorId: true },
      })
      if (article) void this.notifications.notify(article.authorId, 'like', userId, 'article', articleId)
    }
    const count = await this.prisma.like.count({ where: { articleId } })
    return { liked: !existing, count }
  }

  async removeArticle(userId: string, articleId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_articleId: { userId, articleId } },
    })
    if (existing) await this.prisma.like.delete({ where: { id: existing.id } })
    const count = await this.prisma.like.count({ where: { articleId } })
    return { liked: false, count }
  }

  listMine(userId: string) {
    return this.prisma.like.findMany({
      where: { userId },
      include: { video: true, article: true },
      orderBy: { createdAt: 'desc' },
    })
  }
}
