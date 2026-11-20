import { IsArray, IsInt, IsOptional, IsString, Matches } from 'class-validator'

export class CreateVideoDto {
  @IsString()
  @Matches(/^(BV[0-9A-Za-z]+|av\d+)$/i, { message: 'bvid 格式不正确' })
  bvid: string

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
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[]
}
