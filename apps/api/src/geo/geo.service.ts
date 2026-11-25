import { Injectable } from '@nestjs/common'
import { CITY_COORDS } from './cities.data'

type GeoEntry = { name: string; city: string; district?: string; lat: number; lng: number }

// 合肥区县（比地级市更精细，用于更精确跳转）
const DISTRICTS: GeoEntry[] = [
  { name: '蜀山区', city: '合肥', district: '蜀山区', lat: 31.85, lng: 117.17 },
  { name: '庐阳区', city: '合肥', district: '庐阳区', lat: 31.87, lng: 117.27 },
  { name: '包河区', city: '合肥', district: '包河区', lat: 31.8, lng: 117.3 },
  { name: '瑶海区', city: '合肥', district: '瑶海区', lat: 31.86, lng: 117.32 },
  { name: '政务区', city: '合肥', district: '政务区', lat: 31.82, lng: 117.23 },
]

export type ParsedAddress = {
  province: string
  city: string
  district: string
  street: string
  lat: number | null
  lng: number | null
}

@Injectable()
export class GeoService {
  search(q: string) {
    const query = (q ?? '').trim()
    if (!query) return []

    const results: GeoEntry[] = []

    // 地级市：名称包含查询词（命中最多）
    for (const [name, c] of Object.entries(CITY_COORDS)) {
      if (name.includes(query)) {
        results.push({ name, city: name, lat: c.lat, lng: c.lng })
      }
    }

    // 区县：更精细匹配，排在前面
    const districtMatches: GeoEntry[] = []
    for (const d of DISTRICTS) {
      if (d.name.includes(query) || query.includes(d.name)) {
        districtMatches.push(d)
      }
    }

    // 区县优先，然后城市
    return [...districtMatches, ...results].slice(0, 12)
  }

  /**
   * 解析自由文本地址：省 / 市 / 区县 / 详细地址，并尽量给出坐标。
   * 例："安徽省合肥市蜀山区长江西路189号"
   *   → province=安徽省, city=合肥, district=蜀山区, street=长江西路189号
   */
  parse(q: string): ParsedAddress | null {
    const text = (q ?? '').trim()
    if (!text) return null

    let rest = text
    let province = ''
    let cityRaw = ''
    let district = ''

    // 1. 直辖市 或 省
    const muni = rest.match(/^(北京市|上海市|天津市|重庆市)/)
    if (muni) {
      province = muni[1]
      cityRaw = muni[1]
      rest = rest.slice(muni[1].length)
    } else {
      const prov = rest.match(/^(.+?(?:省|自治区|特别行政区))/)
      if (prov) {
        province = prov[1]
        rest = rest.slice(prov[1].length)
      }
    }

    // 2. 市
    if (!cityRaw) {
      const city = rest.match(/^(.+?(?:市|自治州|地区|盟))/)
      if (city) {
        cityRaw = city[1]
        rest = rest.slice(city[1].length)
      }
    }

    // 3. 区 / 县
    const dist = rest.match(/^(.+?(?:区|县|旗))/)
    if (dist) {
      district = dist[1]
      rest = rest.slice(dist[1].length)
    }

    const street = rest.trim()

    // 4. 城市名归一化（去掉行政区后缀）并查坐标
    let cityKey = cityRaw.replace(/(市|自治州|地区|盟)$/, '')
    if (!CITY_COORDS[cityKey]) {
      // 兜底：从文本中匹配已知城市
      for (const name of Object.keys(CITY_COORDS)) {
        if (text.includes(name)) {
          cityKey = name
          break
        }
      }
    }

    // 5. 区县坐标优先（合肥区县库）
    const districtEntry = district
      ? DISTRICTS.find((d) => d.name === district || district.includes(d.name)) ?? null
      : null
    const cityCoord = CITY_COORDS[cityKey]
    const lat = districtEntry?.lat ?? cityCoord?.lat ?? null
    const lng = districtEntry?.lng ?? cityCoord?.lng ?? null

    return {
      province,
      city: cityKey || '',
      district: district || '',
      street,
      lat,
      lng,
    }
  }
}
