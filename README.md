# 대전역 길안내

Node.js 22 이상에서 실행하는 모바일 대응 웹 화면입니다. 서버가 한국관광공사 TourAPI의 `searchFestival2`를 조회해 대전 축제 배너를 최대 3개 제공합니다.

## 실행

PowerShell에서 실행하세요. 로컬에서는 `.env` 파일의 `TOUR_API_SERVICE_KEY`를 읽습니다. GitHub에서 새로 받았다면 `.env.example`을 `.env`로 복사하고 인증키를 채우세요.

```powershell
npm start
```

터미널에 출력된 주소를 브라우저에서 엽니다. 3000번 포트가 이미 사용 중이면 서버가 3001번부터 빈 포트를 찾아 실행합니다. `npm test`로 날짜, 정렬, 요청 파라미터를 검사할 수 있습니다.

## Vercel 배포

GitHub 저장소를 Vercel에 가져올 때 Framework Preset은 **Other**, Root Directory는 저장소 루트로 설정합니다. 프로젝트의 **Settings → Environment Variables**에서 `TOUR_API_SERVICE_KEY`를 설정하고 Production 환경에 적용하세요. `vercel.json`이 `public` 폴더를 정적 화면으로 제공하고, `api/festivals.js`가 축제 조회를 서버리스 함수로 실행합니다. 환경변수를 배포 후에 추가했다면 새 배포를 실행하세요.

TourAPI가 실패하거나 표시할 축제가 없으면 배너 영역을 숨깁니다. 축제 사진은 TourAPI 목록 응답의 `firstimage` 또는 `firstimage2`를 사용하고, 둘 다 없으면 해당 축제에 한해 `detailImage2`에서 이미지를 조회합니다. 사진이 없는 축제는 단색 배경으로 표시됩니다. API 데이터는 응답 시점에 조회하며 서버가 한국 날짜로 행사 상태를 계산합니다. 배너를 누르면 Android에서는 `geo:` 위치 링크로 설치된 지도 앱 선택을 요청하고, iPhone에서는 카카오맵·네이버지도 앱 선택창을 보여줍니다. 데스크톱 웹에서는 네이버지도를 엽니다. 일반 웹 페이지는 설치된 앱 목록을 직접 확인할 수 없습니다.

