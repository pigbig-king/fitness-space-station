import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class UpdateFavoriteListDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string
}
