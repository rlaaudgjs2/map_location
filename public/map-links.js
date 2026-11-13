export function installedMapLink(festival, userAgent = '') {
  const latitude = festival.mapy;
  const longitude = festival.mapx;
  const ios = /iPhone|iPad|iPod/i.test(userAgent);
  const android = /Android/i.test(userAgent);
  if (latitude != null && longitude != null) {
    const coords = `${latitude},${longitude}`;
    if (ios) return `maps://?ll=${coords}&q=${encodeURIComponent(festival.title)}`;
    if (android) return `geo:0,0?q=${encodeURIComponent(coords)}(${encodeURIComponent(festival.title)})`;
    return `https://map.naver.com/p/search/${encodeURIComponent(coords)}?c=${longitude},${latitude},15,0,0,0,dh`;
  }
  if (ios) return `maps://?q=${encodeURIComponent(festival.addr1)}`;
  if (android) return `geo:0,0?q=${encodeURIComponent(festival.addr1)}`;
  return `https://map.naver.com/p/search/${encodeURIComponent(festival.addr1)}`;
}

