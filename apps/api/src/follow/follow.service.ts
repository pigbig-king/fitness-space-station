import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FollowService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('不能关注自己')
    }
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    })
    if (existing) {
      await this.prisma.follow.delete({ where: { id: existing.id } })
    } else {
      await this.prisma.follow.create({ data: { followerId, followingId } })
    }
    const count = await this.prisma.follow.count({ where: { followingId } })
    return { following: !existing, count }
  }

  async remove(followerId: string, followingId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    })
    if (existing) {
      await this.prisma.follow.delete({ where: { id: existing.id } })
    }
    const count = await this.prisma.follow.count({ where: { followingId } })
    return { following: false, count }
  }

  async isFollowing(followerId: string | null, followingId: string) {
    if (!followerId) return false
    const f = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    })
    return Boolean(f)
  }

  listFollowers(userId: string) {
    return this.prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { id: true, nickname: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  listFollowing(userId: string) {
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, nickname: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }
}
