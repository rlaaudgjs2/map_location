import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchFestivals, selectFestivals, seoulToday, shiftDate } from '../festival.js';
import { installedMapLink } from '../public/map-links.js';

const event = (id, start, end, extra = {}) => ({ contentid: String(id), title: `행사 ${id}`, eventstartdate: start, eventenddate: end, mapx: '127.3845', mapy: '36.3504', ...extra });

test('Korean calendar date and 30 day lookback cross UTC and month boundaries', () => {
  assert.equal(seoulToday(new Date('2026-11-12T15:30:00Z')), '20261113');
  assert.equal(shiftDate('20261113', -30), '20261014');
});

test('today, ongoing and upcoming sort; end date remains included; next day excluded; cap at three', () => {
  const result = selectFestivals([
    event(1, '20261115', '20261116'),
    event(2, '20261111', '20261113'),
    event(3, '20261113', '20261113'),
    event(4, '20261114', '20261114'),
    event(5, '20261109', '20261112')
  ], '20261113');
  assert.deepEqual(result.map(({ contentid, status }) => [contentid, status]), [['3', 'D-DAY'], ['2', '진행 중'], ['4', 'D-1']]);
});

test('coordinate or address is required and coordinates retain latitude/longitude order', () => {
  const result = selectFestivals([event(1, '20261114', '20261115', { mapx: '', mapy: '', addr1: '대전광역시 중구' }), event(2, '20261114', '20261115', { mapx: '', mapy: '' }), event(3, '20261114', '20261115')], '20261113');
  assert.equal(result.length, 2);
  assert.deepEqual([result[1].mapy, result[1].mapx], [36.3504, 127.3845]);
  assert.equal(result[0].addr1, '대전광역시 중구');
});

test('TourAPI request uses server key, Daejeon region and list response only', async () => {
  let requested;
  const fakeFetch = async (url) => {
    requested = url;
    return { ok: true, json: async () => ({ response: { header: { resultCode: '0000' }, body: { totalCount: 1, items: { item: [event(1, '20261113', '20261114', { firstimage: 'https://tour.example/photo.jpg' })] } } } }) };
  };
  const result = await fetchFestivals('secret-key', new Date('2026-11-12T15:30:00Z'), fakeFetch);
  assert.equal(requested.pathname, '/B551011/KorService2/searchFestival2');
  assert.equal(requested.searchParams.get('serviceKey'), 'secret-key');
  assert.equal(requested.searchParams.get('lDongRegnCd'), '30');
  assert.equal(requested.searchParams.get('eventStartDate'), '20261014');
  assert.equal(result[0].status, 'D-DAY');
});

test('missing list photo uses official detailImage2 image', async () => {
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(url.pathname);
    const body = url.pathname.endsWith('searchFestival2')
      ? { totalCount: 1, items: { item: [event(1, '20261113', '20261114')] } }
      : { items: { item: [{ originimgurl: 'https://tour.example/detail.jpg' }] } };
    return { ok: true, json: async () => ({ response: { header: { resultCode: '0000' }, body } }) };
  };
  const result = await fetchFestivals('secret-key', new Date('2026-11-12T15:30:00Z'), fakeFetch);
  assert.equal(result[0].image, 'https://tour.example/detail.jpg');
  assert.deepEqual(calls.map((path) => path.split('/').at(-1)), ['searchFestival2', 'detailImage2']);
});

test('official list image is used and invalid image URLs are omitted', () => {
  const result = selectFestivals([event(1, '20261114', '20261115', { firstimage: 'https://tour.example/photo.jpg' }), event(2, '20261114', '20261115', { firstimage: 'javascript:alert(1)' })], '20261113');
  assert.equal(result[0].image, 'https://tour.example/photo.jpg');
  assert.equal(result[1].image, '');
});

test('installed map URI receives latitude then longitude, or searches by address', () => {
  const festival = { title: '대전 축제', mapy: 36.3504, mapx: 127.3845 };
  assert.match(installedMapLink(festival, 'Android'), /^geo:0,0\?q=36\.3504%2C127\.3845/);
  assert.match(installedMapLink(festival, 'iPhone'), /^maps:\/\/\?ll=36\.3504,127\.3845/);
  assert.match(installedMapLink(festival, 'Windows'), /^https:\/\/map\.naver\.com\/p\/search\//);
  assert.ok(installedMapLink(festival, 'Windows').includes(encodeURIComponent('36.3504,127.3845')));
  assert.match(installedMapLink(festival, 'Windows'), /c=127\.3845,36\.3504/);
  const fallback = installedMapLink({ title: '대전 축제', mapy: null, mapx: null, addr1: '대전광역시 중구' }, 'Android');
  assert.ok(fallback.includes(encodeURIComponent('대전광역시 중구')));
  assert.ok(installedMapLink({ title: '대전 축제', mapy: null, mapx: null, addr1: '대전광역시 중구' }, 'Windows').includes(encodeURIComponent('대전광역시 중구')));
});

