import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { BodyMetricsService } from './body-metrics.service'
import { CreateBodyMetricDto } from './dto/create-body-metric.dto'

@Controller()
export class BodyMetricsController {
  constructor(private readonly bodyMetricsService: BodyMetricsService) {}

  @Get('users/me/body-metrics')
  list(@CurrentUser() user: AuthUser, @Query('type') type?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.bodyMetricsService.list(user.id, { type, from, to })
  }

  @Post('users/me/body-metrics')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBodyMetricDto) {
    return this.bodyMetricsService.create(user.id, dto)
  }

  @Delete('users/me/body-metrics/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bodyMetricsService.remove(user.id, id)
  }

  @Get('users/me/bmi')
  bmi(@CurrentUser() user: AuthUser) {
    return this.bodyMetricsService.bmi(user.id)
  }
}
