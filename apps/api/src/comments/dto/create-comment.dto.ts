import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateCommentDto {
  @IsString()
  @MaxLength(1000, { message: '评论最长 1000 字' })
  content: string

  @IsOptional()
  @IsString()
  parentId?: string
}
