import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, type BodyMetricType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBodyMetricDto } from './dto/create-body-metric.dto'

@Injectable()
export class BodyMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, query: { type?: string; from?: string; to?: string }) {
    const where: Prisma.BodyMetricWhereInput = { userId }
    if (query.type) where.type = query.type as BodyMetricType
    if (query.from || query.to) {
      const date: { gte?: string; lte?: string } = {}
      if (query.from) date.gte = query.from
      if (query.to) date.lte = query.to
      where.date = date
    }
    return this.prisma.bodyMetric.findMany({ where, orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] })
  }

  create(userId: string, dto: CreateBodyMetricDto) {
    return this.prisma.bodyMetric.create({
      data: {
        userId,
        type: dto.type as BodyMetricType,
        part: dto.part,
        value: dto.value,
        unit: dto.unit,
        date: dto.date,
        note: dto.note,
      },
    })
  }

  async remove(userId: string, id: string) {
    const metric = await this.prisma.bodyMetric.findUnique({ where: { id } })
    if (!metric || metric.userId !== userId) throw new NotFoundException('记录不存在')
    return this.prisma.bodyMetric.delete({ where: { id } })
  }

  async bmi(userId: string) {
    const [user, latestWeight] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { height: true } }),
      this.prisma.bodyMetric.findFirst({ where: { userId, type: 'WEIGHT' }, orderBy: { date: 'desc' } }),
    ])
    if (!user?.height || !latestWeight) {
      return { height: user?.height ?? null, weight: latestWeight?.value ?? null, bmi: null, date: latestWeight?.date ?? null }
    }
    const h = user.height / 100
    const bmi = latestWeight.value / (h * h)
    return {
      height: user.height,
      weight: latestWeight.value,
      bmi: Math.round(bmi * 10) / 10,
      date: latestWeight.date,
    }
  }
}
