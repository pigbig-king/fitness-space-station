import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { Public } from '../auth/public.decorator'
import { Roles } from '../auth/roles.decorator'
import { CreateReferenceDto } from './dto/create-reference.dto'
import { ReferencesService } from './references.service'

@Controller('references')
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}

  @Public()
  @Get()
  findAll() {
    return this.referencesService.findAll()
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateReferenceDto) {
    return this.referencesService.create(dto)
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.referencesService.remove(id)
  }
}
