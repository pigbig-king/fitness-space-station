import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateBodyMetricDto {
  @IsIn(['WEIGHT', 'BODY_FAT', 'CIRCUMFERENCE', 'RESTING_HEART_RATE'])
  type: string

  @IsOptional()
  @IsString()
  part?: string

  @IsNumber()
  value: number

  @IsString()
  unit: string

  @IsString()
  date: string

  @IsOptional()
  @IsString()
  note?: string
}
