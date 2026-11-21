import { IsIn, IsInt, IsOptional, IsString } from 'class-validator'

export type EvidenceLevelValue =
  | 'META_ANALYSIS'
  | 'SYSTEMATIC_REVIEW'
  | 'RCT'
  | 'COHORT'
  | 'CASE_CONTROL'
  | 'EXPERT_OPINION'
  | 'OTHER'

export class CreateReferenceDto {
  @IsOptional()
  @IsString()
  pmid?: string

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  authors?: string

  @IsOptional()
  @IsInt()
  year?: number

  @IsOptional()
  @IsString()
  journal?: string

  @IsOptional()
  @IsString()
  doi?: string

  @IsOptional()
  @IsString()
  url?: string

  @IsOptional()
  @IsIn(['META_ANALYSIS', 'SYSTEMATIC_REVIEW', 'RCT', 'COHORT', 'CASE_CONTROL', 'EXPERT_OPINION', 'OTHER'])
  evidenceLevel?: EvidenceLevelValue
}
