import { IsOptional, IsString } from 'class-validator'

export class UpdateGymInfoDto {
  @IsOptional()
  @IsString()
  price?: string

  @IsOptional()
  @IsString()
  environment?: string
}
