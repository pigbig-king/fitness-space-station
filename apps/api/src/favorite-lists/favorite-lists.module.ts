import { Module } from '@nestjs/common'
import { FavoriteListsController } from './favorite-lists.controller'
import { FavoriteListsService } from './favorite-lists.service'

@Module({
  controllers: [FavoriteListsController],
  providers: [FavoriteListsService],
  exports: [FavoriteListsService],
})
export class FavoriteListsModule {}
