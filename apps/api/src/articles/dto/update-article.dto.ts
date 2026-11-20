import { IsArray, IsIn, IsOptional, IsString } from 'class-validator'

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED'])
  status?: 'DRAFT' | 'PUBLISHED'

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  referenceIds?: string[]
}
