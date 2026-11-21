import { Module } from '@nestjs/common'
import { ModerationModule } from '../moderation/moderation.module'
import { SearchModule } from '../search/search.module'
import { ArticlesController } from './articles.controller'
import { ArticlesService } from './articles.service'

@Module({
  imports: [SearchModule, ModerationModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
