import { IsInt, IsNumber, IsString } from 'class-validator'

export class CreateWorkoutLogDto {
  @IsString()
  date: string

  @IsString()
  exercise: string

  @IsInt()
  sets: number

  @IsInt()
  reps: number

  @IsNumber()
  weight: number

  @IsNumber()
  rpe: number
}
