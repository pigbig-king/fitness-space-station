import { IsIn, IsString } from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  name: string

  @IsIn(['bodyPart', 'equipment', 'goal', 'topic'], { message: 'type 不合法' })
  type: string
}
