import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async feed(userId: string, page = 1, pageSize = 20) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })
    const followingIds = following.map((f) => f.followingId)

    const where: Prisma.ArticleWhereInput = { status: 'PUBLISHED' }
    if (followingIds.length > 0) {
      where.authorId = { in: followingIds }
    } else {
      return { total: 0, page, pageSize, items: [], empty: true }
    }

    const [total, articles] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        include: {
          author: { select: { id: true, nickname: true, avatarUrl: true } },
          categories: true,
          tags: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const items = articles.map((a) => ({
      type: 'article' as const,
      id: a.id,
      title: a.title,
      summary: a.summary,
      authorId: a.author?.id,
      authorName: a.author?.nickname ?? '',
      authorAvatar: a.author?.avatarUrl ?? null,
      createdAt: a.createdAt,
    }))

    return { total, page, pageSize, items }
  }
}
