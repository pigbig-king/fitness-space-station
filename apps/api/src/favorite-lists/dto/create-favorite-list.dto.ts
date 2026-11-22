import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateFavoriteListDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string
}
