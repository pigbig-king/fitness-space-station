import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  listArticlesByTag(name: string) {
    return this.prisma.article.findMany({
      where: { tags: { some: { name } }, status: 'PUBLISHED' },
      include: {
        tags: true,
        author: { select: { id: true, nickname: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
