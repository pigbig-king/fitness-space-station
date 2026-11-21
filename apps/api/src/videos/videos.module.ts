import { Module } from '@nestjs/common'
import { SearchModule } from '../search/search.module'
import { BilibiliService } from './bilibili.service'
import { VideosController } from './videos.controller'
import { VideosService } from './videos.service'

@Module({
  imports: [SearchModule],
  controllers: [VideosController],
  providers: [VideosService, BilibiliService],
  exports: [VideosService],
})
export class VideosModule {}
