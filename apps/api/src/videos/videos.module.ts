import { Module } from '@nestjs/common'
import { BilibiliService } from './bilibili.service'
import { VideosController } from './videos.controller'
import { VideosService } from './videos.service'

@Module({
  controllers: [VideosController],
  providers: [VideosService, BilibiliService],
  exports: [VideosService],
})
export class VideosModule {}
