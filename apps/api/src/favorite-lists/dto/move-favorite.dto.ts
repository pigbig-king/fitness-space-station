import { IsOptional, IsString } from 'class-validator'

export class MoveFavoriteDto {
  @IsOptional()
  @IsString()
  listId?: string | null
}
