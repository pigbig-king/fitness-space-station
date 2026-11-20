import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCategoryDto } from './dto/create-category.dto'

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seed()
  }

  private async seed() {
    const count = await this.prisma.category.count()
    if (count > 0) return

    const seeds = [
      { name: '胸', type: 'bodyPart' },
      { name: '背', type: 'bodyPart' },
      { name: '腿', type: 'bodyPart' },
      { name: '肩', type: 'bodyPart' },
      { name: '臂', type: 'bodyPart' },
      { name: '核心', type: 'bodyPart' },
      { name: '杠铃', type: 'equipment' },
      { name: '哑铃', type: 'equipment' },
      { name: '自重', type: 'equipment' },
      { name: '器械', type: 'equipment' },
      { name: '增肌', type: 'goal' },
      { name: '力量', type: 'goal' },
      { name: '减脂', type: 'goal' },
    ]

    for (const s of seeds) {
      await this.prisma.category.upsert({ where: { name: s.name }, update: {}, create: s })
    }
  }

  findAll() {
    return this.prisma.category.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] })
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto })
  }

  update(id: string, dto: CreateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data: dto })
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } })
  }
}
