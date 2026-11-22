import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'

export class GymEquipmentDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsInt()
  @Min(1)
  quantity: number
}

export class CreateGymDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  address: string

  @IsString()
  @IsNotEmpty()
  city: string

  @IsOptional()
  @IsString()
  district?: string

  @IsNumber()
  lat: number

  @IsNumber()
  lng: number

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  price?: string

  @IsOptional()
  @IsString()
  hours?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GymEquipmentDto)
  equipment: GymEquipmentDto[]
}
