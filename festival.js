const DAY = 86_400_000;

export function seoulToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('year')}${get('month')}${get('day')}`;
}

function dayNumber(value) {
  if (!/^\d{8}$/.test(String(value ?? ''))) return null;
  const text = String(value);
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(4, 6));
  const day = Number(text.slice(6, 8));
  const utc = Date.UTC(year, month - 1, day);
  const date = new Date(utc);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  return utc / DAY;
}

export function shiftDate(date, days) {
  const shifted = new Date((dayNumber(date) + days) * DAY);
  return `${shifted.getUTCFullYear()}${String(shifted.getUTCMonth() + 1).padStart(2, '0')}${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

export function selectFestivals(items, today = seoulToday()) {
  const current = dayNumber(today);
  return items.flatMap((item) => {
    const start = dayNumber(item.eventstartdate);
    const end = dayNumber(item.eventenddate);
    const title = String(item.title ?? '').trim();
    const latitude = Number(item.mapy);
    const longitude = Number(item.mapx);
    const hasCoordinates = item.mapy !== '' && item.mapx !== '' && item.mapy != null && item.mapx != null && Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    const address = String(item.addr1 ?? '').trim();
    if (!title || start === null || end === null || start > end || end < current || (!hasCoordinates && !address)) return [];
    const daysUntil = start - current;
    return [{
      contentid: String(item.contentid ?? ''), title,
      eventstartdate: String(item.eventstartdate), eventenddate: String(item.eventenddate),
      mapx: hasCoordinates ? longitude : null, mapy: hasCoordinates ? latitude : null,
      addr1: address,
      image: /^https?:\/\//i.test(String(item.firstimage ?? '')) ? String(item.firstimage) : /^https?:\/\//i.test(String(item.firstimage2 ?? '')) ? String(item.firstimage2) : '',
      status: daysUntil === 0 ? 'D-DAY' : daysUntil < 0 ? '진행 중' : `D-${daysUntil}`,
      rank: daysUntil === 0 ? 0 : daysUntil < 0 ? 1 : 2,
      start
    }];
  }).sort((a, b) => a.rank - b.rank || a.start - b.start || a.title.localeCompare(b.title, 'ko')).slice(0, 3).map(({ rank, start, ...festival }) => festival);
}

async function fetchFestivalImage(festival, serviceKey, fetcher) {
  if (festival.image || !festival.contentid) return festival;
  try {
    const url = new URL('https://apis.data.go.kr/B551011/KorService2/detailImage2');
    url.search = new URLSearchParams({ serviceKey, MobileOS: 'ETC', MobileApp: 'DaejeonStationGuide', _type: 'json', contentId: festival.contentid, imageYN: 'Y', subImageYN: 'Y', numOfRows: '10', pageNo: '1' }).toString();
    const response = await fetcher(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return festival;
    const payload = await response.json();
    if (payload.response?.header?.resultCode !== '0000') return festival;
    const raw = payload.response?.body?.items?.item;
    const images = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const image = images.flatMap((item) => [item.originimgurl, item.smallimageurl]).find((value) => /^https?:\/\//i.test(String(value ?? '')));
    return image ? { ...festival, image } : festival;
  } catch { return festival; }
}

export async function fetchFestivals(serviceKey, now = new Date(), fetcher = fetch) {
  if (!serviceKey) throw new Error('TOUR_API_SERVICE_KEY is missing');
  const today = seoulToday(now);
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const url = new URL('https://apis.data.go.kr/B551011/KorService2/searchFestival2');
    url.search = new URLSearchParams({ serviceKey, numOfRows: '1000', pageNo: String(page), MobileOS: 'ETC', MobileApp: 'DaejeonStationGuide', _type: 'json', eventStartDate: shiftDate(today, -30), lDongRegnCd: '30' }).toString();
    const response = await fetcher(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`TourAPI HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.response?.header?.resultCode !== '0000') throw new Error(`TourAPI ${payload.response?.header?.resultCode ?? 'invalid response'}`);
    const body = payload.response.body;
    const items = body?.items?.item;
    const batch = Array.isArray(items) ? items : items ? [items] : [];
    all.push(...batch);
    if (page * 1000 >= Number(body?.totalCount ?? 0) || batch.length === 0) break;
  }
  return Promise.all(selectFestivals(all, today).map((festival) => fetchFestivalImage(festival, serviceKey, fetcher)));
}

