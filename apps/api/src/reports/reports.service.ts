import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateReportDto } from './dto/create-report.dto'

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateReportDto) {
    return this.prisma.report.create({
      data: {
        userId,
        reason: dto.reason,
        videoId: dto.videoId,
        articleId: dto.articleId,
        commentId: dto.commentId,
      },
    })
  }

  findAll() {
    return this.prisma.report.findMany({
      include: {
        user: { select: { id: true, email: true } },
        video: { select: { id: true, title: true } },
        article: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  resolve(id: string) {
    return this.prisma.report.delete({ where: { id } })
  }
}
