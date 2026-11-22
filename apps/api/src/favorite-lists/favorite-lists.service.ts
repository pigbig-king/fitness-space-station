import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFavoriteListDto } from './dto/create-favorite-list.dto'
import { MoveFavoriteDto } from './dto/move-favorite.dto'
import { UpdateFavoriteListDto } from './dto/update-favorite-list.dto'

@Injectable()
export class FavoriteListsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.favoriteList.findMany({
      where: { userId },
      include: { _count: { select: { favorites: true } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  create(userId: string, dto: CreateFavoriteListDto) {
    return this.prisma.favoriteList.create({ data: { userId, name: dto.name } })
  }

  async rename(userId: string, id: string, dto: UpdateFavoriteListDto) {
    const list = await this.prisma.favoriteList.findUnique({ where: { id } })
    if (!list || list.userId !== userId) throw new NotFoundException('收藏夹不存在')
    return this.prisma.favoriteList.update({ where: { id }, data: { name: dto.name } })
  }

  async remove(userId: string, id: string) {
    const list = await this.prisma.favoriteList.findUnique({ where: { id } })
    if (!list || list.userId !== userId) throw new NotFoundException('收藏夹不存在')
    await this.prisma.favoriteList.delete({ where: { id } })
    return { deleted: true }
  }

  async contents(userId: string, id: string) {
    const list = await this.prisma.favoriteList.findUnique({ where: { id } })
    if (!list || list.userId !== userId) throw new NotFoundException('收藏夹不存在')
    return this.prisma.favorite.findMany({
      where: { listId: id },
      include: {
        video: true,
        article: { include: { author: { select: { id: true, nickname: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async move(userId: string, favoriteId: string, dto: MoveFavoriteDto) {
    const fav = await this.prisma.favorite.findUnique({ where: { id: favoriteId } })
    if (!fav || fav.userId !== userId) throw new NotFoundException('收藏不存在')
    if (dto.listId) {
      const list = await this.prisma.favoriteList.findUnique({ where: { id: dto.listId } })
      if (!list || list.userId !== userId) throw new NotFoundException('收藏夹不存在')
    }
    return this.prisma.favorite.update({
      where: { id: favoriteId },
      data: { listId: dto.listId ?? null },
    })
  }
}
