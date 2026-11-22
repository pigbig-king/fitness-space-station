import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const articleInclude = {
  categories: true,
  tags: true,
  author: { select: { id: true, nickname: true, avatarUrl: true } },
  _count: { select: { likes: true, favorites: true, comments: true } },
}

@Injectable()
export class RecommendService {
  constructor(private readonly prisma: PrismaService) {}

  async hot() {
    const [videos, articles] = await Promise.all([
      this.prisma.video.findMany({
        where: { status: 'PUBLISHED' },
        include: { categories: true, _count: { select: { likes: true, favorites: true, comments: true } } },
        take: 50,
      }),
      this.prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        include: articleInclude,
        take: 50,
      }),
    ])
    const score = (c: { likes: number; favorites: number; comments: number }) =>
      c.likes + c.favorites * 2 + c.comments
    videos.sort((a, b) => score(b._count) - score(a._count))
    articles.sort((a, b) => score(b._count) - score(a._count))
    return { videos: videos.slice(0, 8), articles: articles.slice(0, 8) }
  }

  async forYou(userId: string) {
    const [favorites, likes] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          video: { include: { categories: true } },
          article: { include: { categories: true, tags: true } },
        },
      }),
      this.prisma.like.findMany({
        where: { userId },
        include: {
          video: { include: { categories: true } },
          article: { include: { categories: true, tags: true } },
        },
      }),
    ])

    const categoryIds = new Set<string>()
    const tagNames = new Set<string>()
    const excludedVideoIds = new Set<string>()
    const excludedArticleIds = new Set<string>()
    for (const f of favorites) {
      if (f.video) {
        excludedVideoIds.add(f.video.id)
        f.video.categories.forEach((c) => categoryIds.add(c.id))
      }
      if (f.article) {
        excludedArticleIds.add(f.article.id)
        f.article.categories.forEach((c) => categoryIds.add(c.id))
        f.article.tags.forEach((t) => tagNames.add(t.name))
      }
    }
    for (const l of likes) {
      if (l.video) {
        excludedVideoIds.add(l.video.id)
        l.video.categories.forEach((c) => categoryIds.add(c.id))
      }
      if (l.article) {
        excludedArticleIds.add(l.article.id)
        l.article.categories.forEach((c) => categoryIds.add(c.id))
        l.article.tags.forEach((t) => tagNames.add(t.name))
      }
    }

    if (categoryIds.size === 0 && tagNames.size === 0) {
      return this.hot()
    }

    const catArr = [...categoryIds]
    const tagArr = [...tagNames]
    const [videos, articles] = await Promise.all([
      this.prisma.video.findMany({
        where: {
          status: 'PUBLISHED',
          id: { notIn: [...excludedVideoIds] },
          categories: { some: { id: { in: catArr } } },
        },
        include: { categories: true, _count: { select: { likes: true, favorites: true, comments: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      this.prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          id: { notIn: [...excludedArticleIds] },
          OR: [
            { categories: { some: { id: { in: catArr } } } },
            { tags: { some: { name: { in: tagArr } } } },
          ],
        },
        include: articleInclude,
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ])
    return { videos, articles }
  }
}
