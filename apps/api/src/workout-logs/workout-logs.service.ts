import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto'

@Injectable()
export class WorkoutLogsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, query: { from?: string; to?: string; exercise?: string }) {
    const where: Prisma.WorkoutLogWhereInput = { userId }
    if (query.exercise) where.exercise = { contains: query.exercise }
    if (query.from || query.to) {
      const date: { gte?: string; lte?: string } = {}
      if (query.from) date.gte = query.from
      if (query.to) date.lte = query.to
      where.date = date
    }
    return this.prisma.workoutLog.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })
  }

  create(userId: string, dto: CreateWorkoutLogDto) {
    return this.prisma.workoutLog.create({
      data: {
        userId,
        date: dto.date,
        exercise: dto.exercise,
        sets: dto.sets,
        reps: dto.reps,
        weight: dto.weight,
        rpe: dto.rpe,
      },
    })
  }

  async remove(userId: string, id: string) {
    const log = await this.prisma.workoutLog.findUnique({ where: { id } })
    if (!log || log.userId !== userId) throw new NotFoundException('记录不存在')
    return this.prisma.workoutLog.delete({ where: { id } })
  }
}
