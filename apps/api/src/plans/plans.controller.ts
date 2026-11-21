import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { GeneratePlanDto } from './dto/generate-plan.dto'
import { PlansService } from './plans.service'

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.plansService.list(user.id)
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.plansService.findOne(user.id, id)
  }

  @Post('generate')
  generate(@CurrentUser() user: AuthUser, @Body() dto: GeneratePlanDto) {
    return this.plansService.generate(user.id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.plansService.remove(user.id, id)
  }
}
