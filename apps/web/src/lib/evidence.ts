export type EvidenceLevel =
  | 'META_ANALYSIS'
  | 'SYSTEMATIC_REVIEW'
  | 'RCT'
  | 'COHORT'
  | 'CASE_CONTROL'
  | 'EXPERT_OPINION'
  | 'OTHER'

export const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  META_ANALYSIS: 'Meta 分析',
  SYSTEMATIC_REVIEW: '系统综述',
  RCT: '随机对照试验',
  COHORT: '队列研究',
  CASE_CONTROL: '病例对照',
  EXPERT_OPINION: '专家意见',
  OTHER: '其他',
}

export const EVIDENCE_COLORS: Record<EvidenceLevel, string> = {
  META_ANALYSIS: 'bg-emerald-100 text-emerald-800',
  SYSTEMATIC_REVIEW: 'bg-teal-100 text-teal-800',
  RCT: 'bg-blue-100 text-blue-800',
  COHORT: 'bg-indigo-100 text-indigo-800',
  CASE_CONTROL: 'bg-violet-100 text-violet-800',
  EXPERT_OPINION: 'bg-amber-100 text-amber-800',
  OTHER: 'bg-gray-100 text-gray-700',
}
