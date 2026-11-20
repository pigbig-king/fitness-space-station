import { Injectable } from '@nestjs/common'

export type BilibiliVideoInfo = {
  bvid: string
  title: string
  cover: string
  duration: number
  description: string
}

@Injectable()
export class BilibiliService {
  async fetchVideoInfo(bvid: string): Promise<BilibiliVideoInfo | null> {
    const url = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://www.bilibili.com/',
        },
        signal: controller.signal,
      })

      clearTimeout(timer)
      if (!res.ok) return null

      const data = (await res.json()) as {
        code: number
        message?: string
        data?: {
          bvid: string
          title: string
          pic: string
          duration: number
          desc?: string
        }
      }

      if (data.code !== 0 || !data.data) return null

      return {
        bvid: data.data.bvid,
        title: data.data.title,
        cover: data.data.pic,
        duration: data.data.duration,
        description: data.data.desc ?? '',
      }
    } catch {
      return null
    }
  }
}
