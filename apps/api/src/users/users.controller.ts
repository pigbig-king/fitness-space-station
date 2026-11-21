import { Body, Controller, Get, Param, Patch } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { Public } from '../auth/public.decorator'
import { UpdateMeDto } from './dto/update-me.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.id)
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.id, dto)
  }

  @Public()
  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.findPublicProfile(id)
  }
}
