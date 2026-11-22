import { IsString } from 'class-validator'

export class CreateConversationDto {
  @IsString()
  userId: string
}
