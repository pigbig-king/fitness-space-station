import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { GeneratePlanDto } from './dto/generate-plan.dto'

type Exercise = { name: string; sets: number; reps: string; intensity: string }
type Day = { day: number; focus: string; exercises: Exercise[] }

const EXERCISE_POOL: Record<string, string[]> = {
  胸: ['杠铃卧推', '上斜哑铃卧推', '双杠臂屈伸', '哑铃飞鸟'],
  背: ['引体向上', '杠铃划船', '坐姿下拉', '单臂哑铃划船'],
  腿: ['杠铃深蹲', '腿举', '箭步蹲', '罗马尼亚硬拉'],
  肩: ['杠铃推举', '哑铃侧平举', '面拉', '俯身飞鸟'],
  臂: ['杠铃弯举', '哑铃锤式弯举', '绳索下压', '窄距卧推'],
  核心: ['平板支撑', '卷腹', '悬垂举腿', '俄罗斯转体'],
}

function splitByDays(days: number): string[][] {
  if (days <= 2) return [['全身'], ['全身']]
  if (days === 3) return [['胸', '肩', '臂'], ['背', '核心'], ['腿', '核心']]
  if (days === 4) return [['胸', '臂'], ['腿'], ['肩', '核心'], ['背']]
  if (days === 5) return [['胸'], ['背'], ['腿'], ['肩'], ['臂']]
  return [['胸'], ['背'], ['腿'], ['肩'], ['臂'], ['核心']]
}

function repScheme(goal: string, level: string): { sets: number; reps: string; intensity: string } {
  const bonus = level === '高级' ? 1 : level === '中级' ? 0 : -1
  if (goal === '力量') return { sets: Math.max(3, 4 + bonus), reps: '3-6', intensity: '85-90%' }
  if (goal === '减脂') return { sets: 3, reps: '12-15', intensity: '60-70%' }
  return { sets: Math.max(3, 3 + bonus), reps: '8-12', intensity: '70-75%' }
}

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  generate(userId: string, dto: GeneratePlanDto) {
    const content = this.buildPlan(dto)
    return this.prisma.plan.create({
      data: {
        userId,
        goal: dto.goal,
        level: dto.level,
        daysPerWeek: dto.daysPerWeek,
        contentJson: JSON.stringify(content),
      },
    })
  }

  list(userId: string) {
    return this.prisma.plan.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  }

  async findOne(userId: string, id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } })
    if (!plan || plan.userId !== userId) throw new NotFoundException('计划不存在')
    return plan
  }

  async remove(userId: string, id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } })
    if (!plan || plan.userId !== userId) throw new NotFoundException('计划不存在')
    return this.prisma.plan.delete({ where: { id } })
  }

  private buildPlan(dto: GeneratePlanDto): { goal: string; level: string; daysPerWeek: number; days: Day[] } {
    const scheme = repScheme(dto.goal, dto.level)
    const split = splitByDays(dto.daysPerWeek)
    const days: Day[] = split.slice(0, dto.daysPerWeek).map((focuses, i) => ({
      day: i + 1,
      focus: focuses.join('+'),
      exercises: focuses.flatMap(
        (f) =>
          EXERCISE_POOL[f]?.slice(0, 3).map((name) => ({ name, ...scheme })) ?? [],
      ),
    }))
    return { goal: dto.goal, level: dto.level, daysPerWeek: dto.daysPerWeek, days }
  }
}
