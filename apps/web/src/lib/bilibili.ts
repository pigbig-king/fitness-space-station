export function bilibiliUrlToIframe(id: string): string {
  const isBv = /^BV/i.test(id)
  const params = new URLSearchParams({
    [isBv ? 'bvid' : 'aid']: id,
    high_quality: '1',
    danmaku: '0',
    as_wide: '1',
    autoplay: '0',
  })
  const src = `https://player.bilibili.com/player.html?${params.toString()}`
  return `<iframe src="${src}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>`
}
