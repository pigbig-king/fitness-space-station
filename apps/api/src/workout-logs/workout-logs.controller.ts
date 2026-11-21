import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto'
import { WorkoutLogsService } from './workout-logs.service'

@Controller('workout-logs')
export class WorkoutLogsController {
  constructor(private readonly workoutLogsService: WorkoutLogsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('exercise') exercise?: string,
  ) {
    return this.workoutLogsService.list(user.id, { from, to, exercise })
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkoutLogDto) {
    return this.workoutLogsService.create(user.id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workoutLogsService.remove(user.id, id)
  }
}
