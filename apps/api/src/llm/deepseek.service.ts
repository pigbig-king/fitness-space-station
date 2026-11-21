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
}
