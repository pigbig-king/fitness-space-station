import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'

const include = {
  categories: true,
  references: true,
  tags: true,
  author: { select: { id: true, nickname: true, avatarUrl: true } },
  _count: { select: { favorites: true, likes: true, comments: true } },
} satisfies Prisma.ArticleInclude

type ListQuery = { page?: number; pageSize?: number; sort?: 'latest' | 'hot' }

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(viewer: AuthUser | null, query: ListQuery = {}) {
    const page = Math.max(1, query.page ?? 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 10))

    const where: Prisma.ArticleWhereInput = {}
    if (viewer?.role === 'ADMIN') {
      // 管理员可见全部
    } else if (viewer) {
      where.OR = [{ status: 'PUBLISHED' }, { authorId: viewer.id }]
    } else {
      where.status = 'PUBLISHED'
    }

    const orderBy: Prisma.ArticleOrderByWithRelationInput[] =
      query.sort === 'hot'
        ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }]

    const [total, items] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        include,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return { total, page, pageSize, items }
  }

  async findOne(id: string, viewer: AuthUser | null) {
    const article = await this.prisma.article.findUnique({ where: { id }, include })
    if (!article) throw new NotFoundException('文章不存在')

    if (article.status !== 'PUBLISHED') {
      const isAdmin = viewer?.role === 'ADMIN'
      const isAuthor = viewer?.id === article.authorId
      if (!isAdmin && !isAuthor) throw new NotFoundException('文章不存在')
    }
    return article
  }

  create(dto: CreateArticleDto, user: AuthUser) {
    return this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        summary: dto.summary,
        coverUrl: dto.coverUrl,
        status: dto.status ?? 'PUBLISHED',
        authorId: user.id,
        categories: dto.categoryIds?.length
          ? { connect: dto.categoryIds.map((id) => ({ id })) }
          : undefined,
        references: dto.referenceIds?.length
          ? { connect: dto.referenceIds.map((id) => ({ id })) }
          : undefined,
        tags: dto.tagNames?.length
          ? { connectOrCreate: dto.tagNames.map((name) => ({ where: { name }, create: { name } })) }
          : undefined,
      },
      include,
    })
  }

  async update(id: string, dto: UpdateArticleDto, user: AuthUser) {
    const article = await this.prisma.article.findUnique({ where: { id } })
    if (!article) throw new NotFoundException('文章不存在')
    if (user.role !== 'ADMIN' && article.authorId !== user.id) {
      throw new ForbiddenException('无权操作该文章')
    }

    const data: Prisma.ArticleUpdateInput = {}
    if (dto.title !== undefined) data.title = dto.title
    if (dto.content !== undefined) data.content = dto.content
    if (dto.summary !== undefined) data.summary = dto.summary
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl
    if (dto.status !== undefined) data.status = dto.status
    if (dto.categoryIds !== undefined) {
      data.categories = { set: dto.categoryIds.map((id) => ({ id })) }
    }
    if (dto.referenceIds !== undefined) {
      data.references = { set: dto.referenceIds.map((id) => ({ id })) }
    }
    if (dto.tagNames !== undefined) {
      data.tags = {
        set: [],
        connectOrCreate: dto.tagNames.map((name) => ({ where: { name }, create: { name } })),
      }
    }

    return this.prisma.article.update({ where: { id }, data, include })
  }

  async remove(id: string, user: AuthUser) {
    const article = await this.prisma.article.findUnique({ where: { id } })
    if (!article) throw new NotFoundException('文章不存在')
    if (user.role !== 'ADMIN' && article.authorId !== user.id) {
      throw new ForbiddenException('无权操作该文章')
    }
    return this.prisma.article.delete({ where: { id } })
  }
}
