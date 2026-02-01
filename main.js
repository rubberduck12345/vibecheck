// 0. API 키 설정
const OPENWEATHER_API_KEY = '2418e06ce2e9703a5c15643f56790af5';
const WINDY_API_KEY = 'lHIPCRUpuHdv9nD96SIwFCNTUGiYIxlZ';

// 1. 지도 초기화
const map = L.map('map').setView([37.5665, 126.9780], 7); // 서울을 중심으로 지도 표시

// 2. 지도 타일 레이어 추가 (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 3. 도시 데이터
const cities = [
    { name: '서울', coords: [37.5665, 126.9780] },
    { name: '부산', coords: [35.1796, 129.0756] },
    { name: '도쿄', coords: [35.6895, 139.6917] },
    { name: '후쿠오카', coords: [33.5904, 130.4017] },
    { name: '베이징', coords: [39.9042, 116.4074] },
    { name: '상하이', coords: [31.2304, 121.4737] },
    { name: '대련', coords: [38.9140, 121.6147] }
];

// 4. 도시 정보 업데이트 및 표시 함수
async function updateCityInfo(city, marker) {
    marker.setPopupContent(`<b>${city.name}</b><br>정보를 불러오는 중...`).openPopup();

    try {
        // 날씨 정보 가져오기
        const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${city.coords[0]}&lon=${city.coords[1]}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`);
        if (!weatherResponse.ok) throw new Error('날씨 정보 로딩 실패');
        const weatherData = await weatherResponse.json();
        const temp = weatherData.main.temp.toFixed(1);
        const weatherDesc = weatherData.weather[0].description;
        const weatherIcon = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`;

        const weatherHtml = `
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <img src="${weatherIcon}" alt="${weatherDesc}" style="width: 40px; height: 40px; margin-right: 5px;">
                <span>${weatherDesc}, ${temp}°C</span>
            </div>
        `;

        // 웹캠 정보 가져오기
        const windyResponse = await fetch(`https://api.windy.com/api/webcams/v2/list/nearby=${city.coords[0]},${city.coords[1]},50?show=webcams:image,location`, {
            headers: { 'x-windy-key': WINDY_API_KEY }
        });
        if (!windyResponse.ok) throw new Error('웹캠 정보 로딩 실패');
        const windyData = await windyResponse.json();
        const webcam = windyData.result.webcams[0];
        const webcamHtml = webcam
            ? `<a href="${webcam.image.daylight.preview}" target="_blank"><img src="${webcam.image.daylight.preview}" alt="${webcam.title}" style="width: 100%; border-radius: 4px;"></a><br><small>${webcam.title}</small>`
            : '주변에 이용 가능한 웹캠이 없습니다.';

        marker.setPopupContent(`<b>${city.name}</b><br><hr>${weatherHtml}${webcamHtml}`);

    } catch (error) {
        marker.setPopupContent(`<b>${city.name}</b><br><small>${error.message}</small>`);
    }
}


// 5. 도시 마커 추가 및 이벤트 설정
const cityMarkers = {};
cities.forEach(city => {
    const marker = L.marker(city.coords).addTo(map);
    marker.bindPopup(`<b>${city.name}</b>`);
    
    // 마커 클릭 시 정보 업데이트
    marker.on('click', () => updateCityInfo(city, marker));
    
    cityMarkers[city.name] = marker; // 검색 기능을 위해 마커 저장
});

// 6. 검색 기능 구현
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const searchTerm = searchInput.value.trim();
        const foundCity = cities.find(c => c.name === searchTerm);

        if (foundCity) {
            map.setView(foundCity.coords, 11);
            const marker = cityMarkers[foundCity.name];
            // 검색 시에도 정보 업데이트 함수 호출
            updateCityInfo(foundCity, marker);
        } else {
            alert('해당 도시를 찾을 수 없습니다. (예: 서울, 도쿄)');
        }
    }
});
