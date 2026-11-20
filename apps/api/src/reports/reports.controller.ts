import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { Roles } from '../auth/roles.decorator'
import { CreateReportDto } from './dto/create-report.dto'
import { ReportsService } from './reports.service'

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReportDto) {
    return this.reportsService.create(user.id, dto)
  }

  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.reportsService.findAll()
  }

  @Roles('ADMIN')
  @Post(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.reportsService.resolve(id)
  }
}
