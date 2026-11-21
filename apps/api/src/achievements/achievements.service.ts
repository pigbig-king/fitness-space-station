import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { computeStreak } from '../stats/streak.utils'

const DEFINITIONS = [
  { code: 'first_workout', name: '首次训练', description: '完成第一次训练记录', icon: '🏋️' },
  { code: 'streak_7', name: '连续 7 天', description: '连续训练 7 天', icon: '🔥' },
  { code: 'streak_30', name: '连续 30 天', description: '连续训练 30 天', icon: '🌟' },
  { code: 'total_sets_100', name: '百组达人', description: '累计完成 100 组训练', icon: '💪' },
  { code: 'first_article', name: '首次发文', description: '发布第一篇文章', icon: '📝' },
]

@Injectable()
export class AchievementsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seed()
  }

  private async seed() {
    for (const d of DEFINITIONS) {
      await this.prisma.achievement.upsert({
        where: { code: d.code },
        update: {},
        create: d,
      })
    }
  }

  listAll() {
    return this.prisma.achievement.findMany()
  }

  async listMine(userId: string) {
    await this.checkAndUnlock(userId)
    const [all, unlocked] = await Promise.all([
      this.prisma.achievement.findMany(),
      this.prisma.userAchievement.findMany({ where: { userId } }),
    ])
    const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]))
    return all.map((a) => ({
      ...a,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id) ?? null,
    }))
  }

  async checkAndUnlock(userId: string) {
    const [workoutCount, setsAgg, streak, articleCount] = await Promise.all([
      this.prisma.workoutLog.count({ where: { userId } }),
      this.prisma.workoutLog.aggregate({ where: { userId }, _sum: { sets: true } }),
      this.prisma.workoutLog.findMany({ where: { userId }, select: { date: true } }).then((l) => computeStreak(l.map((x) => x.date))),
      this.prisma.article.count({ where: { authorId: userId } }),
    ])

    const conditions: { code: string; met: boolean }[] = [
      { code: 'first_workout', met: workoutCount >= 1 },
      { code: 'streak_7', met: streak.current >= 7 || streak.best >= 7 },
      { code: 'streak_30', met: streak.current >= 30 || streak.best >= 30 },
      { code: 'total_sets_100', met: (setsAgg._sum.sets ?? 0) >= 100 },
      { code: 'first_article', met: articleCount >= 1 },
    ]

    for (const c of conditions) {
      if (!c.met) continue
      const ach = await this.prisma.achievement.findUnique({ where: { code: c.code } })
      if (!ach) continue
      await this.prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId: ach.id } },
        update: {},
        create: { userId, achievementId: ach.id },
      })
    }
  }
}
