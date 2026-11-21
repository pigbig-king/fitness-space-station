import { Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module'
import { FollowController } from './follow.controller'
import { FollowService } from './follow.service'

@Module({
  imports: [NotificationsModule],
  controllers: [FollowController],
  providers: [FollowService],
  exports: [FollowService],
})
export class FollowModule {}
