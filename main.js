// 0. API 키 설정
const OPENWEATHER_API_KEY = '2418e06ce2e9703a5c15643f56790af5';
const WINDY_API_KEY = 'lHIPCRUpuHdv9nD96SIwFCNTUGiYIxlZ';

// 1. 지도 초기화
const map = L.map('map').setView([37.5665, 126.9780], 7); // 서울을 중심으로 지도 표시

// 2. 지도 타일 레이어 추가 (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 3. 도시 데이터 (유의어 추가)
const cities = [
    { name: '서울', synonyms: ['seoul'], coords: [37.5665, 126.9780] },
    { name: '부산', synonyms: ['busan', 'pusan'], coords: [35.1796, 129.0756] },
    { name: '도쿄', synonyms: ['tokyo', '동경'], coords: [35.6895, 139.6917] },
    { name: '후쿠오카', synonyms: ['fukuoka'], coords: [33.5904, 130.4017] },
    { name: '베이징', synonyms: ['beijing', '북경'], coords: [39.9042, 116.4074] },
    { name: '상하이', synonyms: ['shanghai', '상해'], coords: [31.2304, 121.4737] },
    { name: '대련', synonyms: ['dalian'], coords: [38.9140, 121.6147] }
];

// 4. 도시 정보 업데이트 및 표시 함수 (API 호출 분리)
async function updateCityInfo(city, marker) {
    marker.setPopupContent(`<b>${city.name}</b><br>정보를 불러오는 중...`).openPopup();

    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${city.coords[0]}&lon=${city.coords[1]}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`;
    const windyURL = `https://api.windy.com/api/webcams/v2/list/nearby=${city.coords[0]},${city.coords[1]},50?show=webcams:image,location`;

    const [weatherResult, windyResult] = await Promise.allSettled([
        fetch(weatherURL),
        fetch(windyURL, { headers: { 'x-windy-key': WINDY_API_KEY } })
    ]);

    let weatherHtml = '<small>날씨 정보 로딩 실패</small>';
    if (weatherResult.status === 'fulfilled' && weatherResult.value.ok) {
        const weatherData = await weatherResult.value.json();
        const temp = weatherData.main.temp.toFixed(1);
        const weatherDesc = weatherData.weather[0].description;
        const weatherIcon = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`;
        weatherHtml = `
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <img src="${weatherIcon}" alt="${weatherDesc}" style="width: 40px; height: 40px; margin-right: 5px;">
                <span>${weatherDesc}, ${temp}°C</span>
            </div>
        `;
    }

    let webcamHtml = '<small>웹캠 정보 로딩 실패</small>';
    if (windyResult.status === 'fulfilled' && windyResult.value.ok) {
        const windyData = await windyResult.value.json();
        const webcam = windyData.result.webcams[0];
        if (webcam) {
            webcamHtml = `<a href="${webcam.image.daylight.preview}" target="_blank"><img src="${webcam.image.daylight.preview}" alt="${webcam.title}" style="width: 100%; border-radius: 4px;"></a><br><small>${webcam.title}</small>`;
        } else {
            webcamHtml = '<small>주변에 이용 가능한 웹캠이 없습니다.</small>';
        }
    }
    
    marker.setPopupContent(`<b>${city.name}</b><br><hr>${weatherHtml}${webcamHtml}`);
}


// 5. 도시 마커 추가 및 이벤트 설정
const cityMarkers = {};
cities.forEach(city => {
    const marker = L.marker(city.coords).addTo(map);
    marker.bindPopup(`<b>${city.name}</b>`);
    marker.on('click', () => updateCityInfo(city, marker));
    cityMarkers[city.name] = marker;
});

// 6. 검색 및 자동완성 기능 구현
const searchInput = document.getElementById('search-input');
const autocompleteResults = document.getElementById('autocomplete-results');

function findCity(searchTerm) {
    const term = searchTerm.toLowerCase();
    return cities.find(city =>
        city.name.toLowerCase() === term || city.synonyms.includes(term)
    );
}

function showCity(city) {
    if (city) {
        map.setView(city.coords, 11);
        const marker = cityMarkers[city.name];
        updateCityInfo(city, marker);
        searchInput.value = city.name;
        autocompleteResults.innerHTML = '';
    }
}

searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase();
    autocompleteResults.innerHTML = '';
    if (!term) return;

    const matchedCities = cities.filter(city =>
        city.name.toLowerCase().includes(term) ||
        city.synonyms.some(s => s.includes(term))
    );

    matchedCities.forEach(city => {
        const item = document.createElement('div');
        item.textContent = city.name;
        item.addEventListener('click', () => {
            showCity(city);
        });
        autocompleteResults.appendChild(item);
    });
});

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const city = findCity(searchInput.value.trim());
        if (city) {
            showCity(city);
        } else {
            autocompleteResults.innerHTML = '';
            alert('해당 도시를 찾을 수 없습니다.');
        }
    }
});

document.addEventListener('click', (event) => {
    if (event.target !== searchInput) {
        autocompleteResults.innerHTML = '';
    }
});
