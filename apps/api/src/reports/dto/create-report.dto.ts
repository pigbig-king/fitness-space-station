import { IsOptional, IsString } from 'class-validator'

export class CreateReportDto {
  @IsString()
  reason: string

  @IsOptional()
  @IsString()
  videoId?: string

  @IsOptional()
  @IsString()
  articleId?: string

  @IsOptional()
  @IsString()
  commentId?: string
}
