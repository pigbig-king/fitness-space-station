import { Injectable } from '@nestjs/common'

type GeoEntry = { name: string; city: string; district?: string; lat: number; lng: number }

// 主要城市中心坐标（WGS-84 近似）
const CITIES: GeoEntry[] = [
  { name: '合肥', city: '合肥', lat: 31.8206, lng: 117.2272 },
  { name: '北京', city: '北京', lat: 39.9042, lng: 116.4074 },
  { name: '上海', city: '上海', lat: 31.2304, lng: 121.4737 },
  { name: '广州', city: '广州', lat: 23.1291, lng: 113.2644 },
  { name: '深圳', city: '深圳', lat: 22.5431, lng: 114.0579 },
  { name: '杭州', city: '杭州', lat: 30.2741, lng: 120.1551 },
  { name: '南京', city: '南京', lat: 32.0603, lng: 118.7969 },
  { name: '武汉', city: '武汉', lat: 30.5928, lng: 114.3055 },
  { name: '成都', city: '成都', lat: 30.5723, lng: 104.0665 },
  { name: '重庆', city: '重庆', lat: 29.563, lng: 106.5516 },
  { name: '西安', city: '西安', lat: 34.3416, lng: 108.9398 },
  { name: '天津', city: '天津', lat: 39.1256, lng: 117.1902 },
  { name: '苏州', city: '苏州', lat: 31.2983, lng: 120.5832 },
  { name: '长沙', city: '长沙', lat: 28.2282, lng: 112.9388 },
  { name: '郑州', city: '郑州', lat: 34.7466, lng: 113.6254 },
  { name: '青岛', city: '青岛', lat: 36.0671, lng: 120.3826 },
  { name: '济南', city: '济南', lat: 36.6512, lng: 117.1201 },
  { name: '厦门', city: '厦门', lat: 24.4798, lng: 118.0894 },
  { name: '福州', city: '福州', lat: 26.0745, lng: 119.2965 },
  { name: '沈阳', city: '沈阳', lat: 41.8057, lng: 123.4315 },
  { name: '大连', city: '大连', lat: 38.914, lng: 121.6147 },
  { name: '哈尔滨', city: '哈尔滨', lat: 45.8038, lng: 126.5349 },
  { name: '昆明', city: '昆明', lat: 24.8801, lng: 102.8329 },
  { name: '南昌', city: '南昌', lat: 28.6829, lng: 115.8582 },
  { name: '无锡', city: '无锡', lat: 31.4912, lng: 120.3119 },
  { name: '宁波', city: '宁波', lat: 29.8746, lng: 121.5503 },
]

// 合肥区县（用于更精确跳转）
const DISTRICTS: GeoEntry[] = [
  { name: '蜀山区', city: '合肥', district: '蜀山区', lat: 31.85, lng: 117.17 },
  { name: '庐阳区', city: '合肥', district: '庐阳区', lat: 31.87, lng: 117.27 },
  { name: '包河区', city: '合肥', district: '包河区', lat: 31.8, lng: 117.3 },
  { name: '瑶海区', city: '合肥', district: '瑶海区', lat: 31.86, lng: 117.32 },
  { name: '政务区', city: '合肥', district: '政务区', lat: 31.82, lng: 117.23 },
]

@Injectable()
export class GeoService {
  search(q: string) {
    const query = (q ?? '').trim()
    if (!query) return []

    const results: GeoEntry[] = []
    for (const c of CITIES) {
      if (c.name.includes(query) || query.includes(c.name)) {
        results.push(c)
      }
    }
    for (const d of DISTRICTS) {
      if (d.name.includes(query) || query.includes(d.name)) {
        results.push(d)
      }
    }
    // 去重（同坐标）
    const seen = new Set<string>()
    return results
      .filter((r) => {
        const key = `${r.lat.toFixed(4)},${r.lng.toFixed(4)}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 10)
  }
}
