import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { computeStreak } from './streak.utils'

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async streak(userId: string) {
    const logs = await this.prisma.workoutLog.findMany({
      where: { userId },
      select: { date: true },
    })
    return computeStreak(logs.map((l) => l.date))
  }

  async leaderboard(type: string, currentUserId?: string) {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        workoutLogs: { select: { date: true, sets: true, reps: true, weight: true } },
        _count: { select: { articles: true } },
      },
    })

    const rows = users.map((u) => {
      const distinctDays = new Set(u.workoutLogs.map((w) => w.date)).size
      const volume = u.workoutLogs.reduce((s, w) => s + w.sets * w.reps * w.weight, 0)
      return {
        userId: u.id,
        nickname: u.nickname,
        avatarUrl: u.avatarUrl,
        streak: distinctDays,
        volume: Math.round(volume * 10) / 10,
        posts: u._count.articles,
      }
    })

    rows.sort((a, b) => {
      if (type === 'volume') return b.volume - a.volume
      if (type === 'posts') return b.posts - a.posts
      return b.streak - a.streak
    })

    const items = rows.slice(0, 20)
    const myIndex = currentUserId ? rows.findIndex((r) => r.userId === currentUserId) : -1
    return {
      items,
      myRank: myIndex >= 0 ? myIndex + 1 : null,
      myRow: myIndex >= 0 ? rows[myIndex] : null,
    }
  }
}
