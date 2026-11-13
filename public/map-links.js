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

export function iosMapAppLinks(festival, origin) {
  const appname = encodeURIComponent(origin);
  if (festival.mapy != null && festival.mapx != null) {
    const coords = `${festival.mapy},${festival.mapx}`;
    return [
      ['카카오맵 앱', `kakaomap://look?p=${coords}`],
      ['네이버지도 앱', `nmap://place?lat=${festival.mapy}&lng=${festival.mapx}&name=${encodeURIComponent(festival.title)}&appname=${appname}`]
    ];
  }
  const address = encodeURIComponent(festival.addr1);
  return [
    ['카카오맵 앱', `kakaomap://search?q=${address}`],
    ['네이버지도 앱', `nmap://search?query=${address}&appname=${appname}`]
  ];
}

export function shouldShowMapChoices(userAgent, coarsePointer = false) {
  return /iPhone|iPad|iPod|Android|Mobile|KAKAOTALK/i.test(userAgent) || coarsePointer;
}

