import { IsIn, IsInt, Max, Min } from 'class-validator'

export class GeneratePlanDto {
  @IsIn(['增肌', '力量', '减脂'])
  goal: string

  @IsIn(['初级', '中级', '高级'])
  level: string

  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek: number
}
