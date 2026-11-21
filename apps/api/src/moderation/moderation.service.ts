import { Injectable } from '@nestjs/common'
import { DeepseekService } from '../llm/deepseek.service'
import { PrismaService } from '../prisma/prisma.service'
import { SENSITIVE_WORDS } from './sensitive-words'

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deepseek: DeepseekService,
  ) {}

  containsSensitive(text: string): string[] {
    const lower = text.toLowerCase()
    return SENSITIVE_WORDS.filter((w) => lower.includes(w.toLowerCase()))
  }

  async moderate(text: string): Promise<'safe' | 'risky' | 'unknown'> {
    return this.deepseek.moderate(text)
  }

  async reviewAndMaybeDraft(articleId: string) {
    try {
      const article = await this.prisma.article.findUnique({ where: { id: articleId } })
      if (!article || article.status !== 'PUBLISHED') return
      const verdict = await this.moderate(`${article.title}\n${article.content}`)
      if (verdict === 'risky') {
        await this.prisma.article.update({ where: { id: articleId }, data: { status: 'DRAFT' } })
      }
    } catch {
      /* ignore */
    }
  }
}
