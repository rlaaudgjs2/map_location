import { installedMapLink, iosMapAppLinks } from './map-links.js';

const section = document.querySelector('#festival-section');
const list = document.querySelector('#festival-list');
const dialog = document.querySelector('#map-dialog');
const dialogName = document.querySelector('#dialog-name');
const mapChoices = document.querySelector('#map-choices');

function openMapChoice(festival) {
  dialogName.textContent = festival.title;
  mapChoices.replaceChildren(...iosMapAppLinks(festival, window.location.origin).map(([label, url]) => {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = label;
    return link;
  }));
  dialog.showModal();
}

document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

function dateLabel(value) { return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`; }

async function loadFestivals() {
  try {
    const response = await fetch('/api/festivals', { cache: 'no-store' });
    if (!response.ok) return;
    const { festivals } = await response.json();
    if (!Array.isArray(festivals) || festivals.length === 0) return;
    list.replaceChildren(...festivals.slice(0, 3).map((festival) => {
      const button = document.createElement('button');
      button.className = 'festival-card';
      button.type = 'button';
      button.setAttribute('aria-label', `${festival.title}, 지도 앱에서 열기`);
      if (festival.image) {
        const photo = document.createElement('img');
        photo.className = 'festival-photo';
        photo.src = festival.image;
        photo.alt = '';
        photo.loading = 'lazy';
        button.append(photo);
        button.classList.add('has-photo');
      }
      const shade = document.createElement('span'); shade.className = 'festival-shade'; shade.setAttribute('aria-hidden', 'true');
      const badge = document.createElement('span'); badge.className = 'status'; badge.textContent = festival.status;
      const title = document.createElement('strong'); title.textContent = festival.title;
      const period = document.createElement('span'); period.className = 'period'; period.textContent = `${dateLabel(festival.eventstartdate)} – ${dateLabel(festival.eventenddate)}`;
      const arrow = document.createElement('span'); arrow.className = 'card-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      button.append(shade, badge, title, period, arrow);
      button.addEventListener('click', () => {
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) openMapChoice(festival);
        else window.location.href = installedMapLink(festival, navigator.userAgent);
      });
      return button;
    }));
    section.hidden = false;
  } catch { /* Keep the festival page usable when TourAPI fails. */ }
}
loadFestivals();

