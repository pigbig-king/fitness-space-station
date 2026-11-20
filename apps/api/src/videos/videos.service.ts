import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { BilibiliService } from './bilibili.service'
import { CreateVideoDto } from './dto/create-video.dto'
import { UpdateVideoDto } from './dto/update-video.dto'

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bilibili: BilibiliService,
  ) {}

  async findAll(query: { q?: string; category?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page ?? 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 20))

    const where: Prisma.VideoWhereInput = {}
    if (query.category) where.categories = { some: { id: query.category } }
    if (query.q) where.title = { contains: query.q }

    const [total, items] = await Promise.all([
      this.prisma.video.count({ where }),
      this.prisma.video.findMany({
        where,
        include: { categories: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return { total, page, pageSize, items }
  }

  async findOne(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: { categories: true, references: true },
    })
    if (!video) throw new NotFoundException('视频不存在')
    return video
  }

  async create(dto: CreateVideoDto) {
    const meta = await this.bilibili.fetchVideoInfo(dto.bvid)

    const data: Prisma.VideoCreateInput = {
      bvid: dto.bvid,
      title: meta?.title ?? dto.title ?? dto.bvid,
      cover: meta?.cover ?? dto.cover,
      duration: meta?.duration ?? dto.duration,
      description: meta?.description ?? dto.description,
      source: 'IMPORTED',
      status: 'DRAFT',
    }

    if (dto.categoryIds?.length) {
      data.categories = { connect: dto.categoryIds.map((id) => ({ id })) }
    }

    return this.prisma.video.create({ data, include: { categories: true } })
  }

  async update(id: string, dto: UpdateVideoDto) {
    await this.findOne(id)

    const data: Prisma.VideoUpdateInput = {}
    if (dto.title !== undefined) data.title = dto.title
    if (dto.cover !== undefined) data.cover = dto.cover
    if (dto.duration !== undefined) data.duration = dto.duration
    if (dto.description !== undefined) data.description = dto.description
    if (dto.status !== undefined) data.status = dto.status
    if (dto.categoryIds !== undefined) {
      data.categories = { set: dto.categoryIds.map((id) => ({ id })) }
    }

    return this.prisma.video.update({ where: { id }, data, include: { categories: true } })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.video.delete({ where: { id } })
  }
}
