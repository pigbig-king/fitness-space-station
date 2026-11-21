import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

@Injectable()
export class DeepseekService {
  private client: OpenAI | null = null

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('DEEPSEEK_API_KEY')
    if (apiKey) {
      this.client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' })
    }
  }

  async translateToZh(text: string): Promise<string | null> {
    if (!this.client || !text) return null
    try {
      const res = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是专业的运动科学翻译，把英文文献摘要翻译成简洁通顺的中文简介，不超过 200 字。',
          },
          { role: 'user', content: text.slice(0, 4000) },
        ],
      })
      return res.choices[0]?.message?.content?.trim() ?? null
    } catch {
      return null
    }
  }

  async moderate(text: string): Promise<'safe' | 'risky' | 'unknown'> {
    if (!this.client || !text) return 'unknown'
    try {
      const res = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是内容安全审核员。判断以下内容是否含有违规高风险内容（色情、暴力、违法、诈骗、人身攻击、政治敏感等）。只回答 safe 或 risky。',
          },
          { role: 'user', content: text.slice(0, 2000) },
        ],
      })
      const verdict = res.choices[0]?.message?.content?.trim().toLowerCase() ?? ''
      return verdict.includes('risky') ? 'risky' : 'safe'
    } catch {
      return 'unknown'
    }
  }
}
