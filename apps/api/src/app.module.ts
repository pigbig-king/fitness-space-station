import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ArticlesModule } from './articles/articles.module'
import { AuthModule } from './auth/auth.module'
import { JwtAuthGuard } from './auth/jwt-auth.guard'
import { RolesGuard } from './auth/roles.guard'
import { CategoriesModule } from './categories/categories.module'
import { CommentsModule } from './comments/comments.module'
import { FavoritesModule } from './favorites/favorites.module'
import { FollowModule } from './follow/follow.module'
import { LikesModule } from './likes/likes.module'
import { LlmModule } from './llm/llm.module'
import { PrismaModule } from './prisma/prisma.module'
import { PubmedModule } from './pubmed/pubmed.module'
import { ReferencesModule } from './references/references.module'
import { ReportsModule } from './reports/reports.module'
import { TagsModule } from './tags/tags.module'
import { UsersModule } from './users/users.module'
import { VideosModule } from './videos/videos.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    VideosModule,
    ArticlesModule,
    ReferencesModule,
    PubmedModule,
    FavoritesModule,
    LikesModule,
    CommentsModule,
    ReportsModule,
    FollowModule,
    TagsModule,
    LlmModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
