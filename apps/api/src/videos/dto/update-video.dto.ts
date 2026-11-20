import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator'

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  cover?: string

  @IsOptional()
  @IsInt()
  duration?: number

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED'])
  status?: 'DRAFT' | 'PUBLISHED'

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[]
}
