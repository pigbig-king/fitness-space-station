import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleVideo(userId: string, videoId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_videoId: { userId, videoId } },
    })
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } })
    } else {
      await this.prisma.favorite.create({ data: { userId, videoId } })
    }
    const count = await this.prisma.favorite.count({ where: { videoId } })
    return { favorited: !existing, count }
  }

  async removeVideo(userId: string, videoId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_videoId: { userId, videoId } },
    })
    if (existing) await this.prisma.favorite.delete({ where: { id: existing.id } })
    const count = await this.prisma.favorite.count({ where: { videoId } })
    return { favorited: false, count }
  }

  async toggleArticle(userId: string, articleId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } },
    })
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } })
    } else {
      await this.prisma.favorite.create({ data: { userId, articleId } })
    }
    const count = await this.prisma.favorite.count({ where: { articleId } })
    return { favorited: !existing, count }
  }

  async removeArticle(userId: string, articleId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_articleId: { userId, articleId } },
    })
    if (existing) await this.prisma.favorite.delete({ where: { id: existing.id } })
    const count = await this.prisma.favorite.count({ where: { articleId } })
    return { favorited: false, count }
  }

  listMine(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: { video: true, article: true },
      orderBy: { createdAt: 'desc' },
    })
  }
}
