import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.article.findMany({
      include: { categories: true, references: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { categories: true, references: true },
    })
    if (!article) throw new NotFoundException('文章不存在')
    return article
  }

  async create(dto: CreateArticleDto) {
    return this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        status: dto.status ?? 'DRAFT',
        categories: dto.categoryIds?.length
          ? { connect: dto.categoryIds.map((id) => ({ id })) }
          : undefined,
        references: dto.referenceIds?.length
          ? { connect: dto.referenceIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { categories: true, references: true },
    })
  }

  async update(id: string, dto: UpdateArticleDto) {
    await this.findOne(id)

    const data: Prisma.ArticleUpdateInput = {}
    if (dto.title !== undefined) data.title = dto.title
    if (dto.content !== undefined) data.content = dto.content
    if (dto.status !== undefined) data.status = dto.status
    if (dto.categoryIds !== undefined) {
      data.categories = { set: dto.categoryIds.map((id) => ({ id })) }
    }
    if (dto.referenceIds !== undefined) {
      data.references = { set: dto.referenceIds.map((id) => ({ id })) }
    }

    return this.prisma.article.update({
      where: { id },
      data,
      include: { categories: true, references: true },
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.article.delete({ where: { id } })
  }
}
