import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateReferenceDto } from './dto/create-reference.dto'

@Injectable()
export class ReferencesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.reference.findMany({ orderBy: { title: 'asc' } })
  }

  create(dto: CreateReferenceDto) {
    return this.prisma.reference.create({ data: dto })
  }

  remove(id: string) {
    return this.prisma.reference.delete({ where: { id } })
  }
}
