import { BadRequestException, Injectable } from '@nestjs/common'
import type { EvidenceLevel } from '@prisma/client'
import { DeepseekService } from '../llm/deepseek.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateReferenceDto } from './dto/create-reference.dto'

const TOOL = 'fitness-space-station'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

@Injectable()
export class ReferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deepseek: DeepseekService,
  ) {}

  findAll() {
    return this.prisma.reference.findMany({ orderBy: { title: 'asc' } })
  }

  async create(dto: CreateReferenceDto) {
    if (dto.pmid && !dto.title) {
      return this.importFromPubmed(dto.pmid, dto.evidenceLevel)
    }
    if (!dto.title) {
      throw new BadRequestException('缺少标题或 PMID')
    }
    return this.prisma.reference.create({
      data: {
        title: dto.title,
        authors: dto.authors,
        year: dto.year,
        journal: dto.journal,
        doi: dto.doi,
        url: dto.url,
        pmid: dto.pmid,
        evidenceLevel: dto.evidenceLevel as EvidenceLevel | undefined,
      },
    })
  }

  async importFromPubmed(pmid: string, evidenceLevel?: EvidenceLevel) {
    const meta = await this.fetchSummary(pmid)
    const abstract = await this.fetchAbstract(pmid)
    const summaryZh = await this.deepseek.translateToZh(abstract || meta.title)

    return this.prisma.reference.create({
      data: {
        title: meta.title,
        authors: meta.authors,
        year: meta.year,
        journal: meta.journal,
        doi: meta.doi,
        pmid,
        summaryZh,
        evidenceLevel,
      },
    })
  }

  private async fetchSummary(pmid: string) {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmid}&tool=${TOOL}`
    const data = await this.fetchJson(url)
    const item = data?.result?.[pmid]
    if (!item) throw new BadRequestException('PMID 无效')

    const authors = (item.authors ?? [])
      .map((a: { name?: string }) => a.name)
      .filter(Boolean)
      .join(', ')
    const yearStr = String(item.pubdate ?? '').match(/\d{4}/)?.[0]
    const doi = (item.articleids ?? []).find((a: { idtype?: string }) => a.idtype === 'doi')?.value

    return {
      title: item.title ?? '',
      authors: authors || undefined,
      year: yearStr ? parseInt(yearStr, 10) : undefined,
      journal: item.fulljournalname ?? item.source ?? undefined,
      doi: doi || undefined,
    }
  }

  private async fetchAbstract(pmid: string): Promise<string | null> {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text&tool=${TOOL}`
    try {
      const res = await this.fetchWithTimeout(url)
      if (!res.ok) return null
      const text = (await res.text()).trim()
      return text && !text.includes('Error occurred') ? text.slice(0, 4000) : null
    } catch {
      return null
    }
  }

  private async fetchJson(url: string): Promise<any> {
    try {
      const res = await this.fetchWithTimeout(url)
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }

  private async fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(url, { headers: { 'User-Agent': UA }, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  remove(id: string) {
    return this.prisma.reference.delete({ where: { id } })
  }
}
