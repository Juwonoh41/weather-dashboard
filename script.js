//web api
var search = [];
var weatherApi = 'https://api.openweathermap.org';
var weatherKey = 'd91f911bcf2c0f925fb6535547a5ddc9';


var searchEl = document.querySelector('#history');
var searchInputEl = document.querySelector('#search-input');
var form = document.querySelector('#search-form');
var todayEl = document.querySelector('#today');
var forecastEl = document.querySelector('#forecast');



dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);


function showSearchHistory() {
  searchEl.innerHTML = '';

  for (var i = search.length - 1; i >= 0; i--) {
    var btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-controls', 'today forecast');
    btn.classList.add('history-btn', 'btn-history');

    btn.setAttribute('data-search', search[i]);
    btn.textContent = search[i];
    searchEl.append(btn);
  }
}


function appendToHistory(search) {
  
  if (search.indexOf(search) !== -1) {
    return;
  }
  search.push(search);

  localStorage.setItem('search-history', JSON.stringify(search));
  showSearchHistory();
}

function initSearchHistory() {
  var storedHistory = localStorage.getItem('search-history');
  if (storedHistory) {
    search = JSON.parse(storedHistory);
  }
  showSearchHistory();
}


function renderCurrentWeather(city, weather, timezone) {
  var date = dayjs().tz(timezone).format('M/D/YYYY');

  var temp = weather.temp;
  var windSpeed = weather.wind_speed;
  var humidity = weather.humidity;
  var uvi = weather.uvi;
  var iconUrl = `https://openweathermap.org/img/w/${weather.weather[0].icon}.png`;
  var iconDescription = weather.weather[0].description || weather[0].main;

  var containerEl = document.createElement('div');
  var containerBodyEl = document.createElement('div');
  var heading = document.createElement('h2');
  var weatherIcon = document.createElement('img');
  var tempEl = document.createElement('p');
  var windEl = document.createElement('p');
  var humidityEl = document.createElement('p');
  var uvEl = document.createElement('p');
  var uviBadge = document.createElement('button');

  containerEl.setAttribute('class', 'card');
  containerBodyEl.setAttribute('class', 'card-body');
  containerEl.append(containerBodyEl);

  heading.setAttribute('class', 'h3 card-title');
  tempEl.setAttribute('class', 'card-text');
  windEl.setAttribute('class', 'card-text');
  humidityEl.setAttribute('class', 'card-text');

  heading.textContent = `${city} (${date})`;
  weatherIcon.setAttribute('src', iconUrl);
  weatherIcon.setAttribute('alt', iconDescription);
  weatherIcon.setAttribute('class', 'weather-img');
  heading.append(weatherIcon);
  tempEl.textContent = `Temp: ${temp}°F`;
  windEl.textContent = `Wind: ${windSpeed} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;
  containerBodyEl.append(heading, tempEl, windEl, humidityEl);

  uvEl.textContent = 'UV Index: ';
  uviBadge.classList.add('btn', 'btn-sm');

  if (uvi < 3) {
    uviBadge.classList.add('btn-success');
  } else if (uvi < 7) {
    uviBadge.classList.add('btn-warning');
  } else {
    uviBadge.classList.add('btn-danger');
  }

  uviBadge.textContent = uvi;
  uvEl.append(uviBadge);
  containerBodyEl.append(uvEl);

  todayEl.innerHTML = '';
  todayEl.append(containerEl);
}


function renderForecastCard(forecast, timezone) {
  var unixTs = forecast.dt;
  var iconUrl = `https://openweathermap.org/img/w/${forecast.weather[0].icon}.png`;
  var iconDescription = forecast.weather[0].description;
  var tempF = forecast.temp.day;
  var { humidity } = forecast;
  var windMph = forecast.wind_speed;

  var col = document.createElement('div');
  var card = document.createElement('div');
  var cardBody = document.createElement('div');
  var cardTitle = document.createElement('h5');
  var weatherIcon = document.createElement('img');
  var tempEl = document.createElement('p');
  var windEl = document.createElement('p');
  var humidityEl = document.createElement('p');

  col.append(card);
  card.append(cardBody);
  cardBody.append(cardTitle, weatherIcon, tempEl, windEl, humidityEl);

  col.setAttribute('class', 'col-md');
  col.classList.add('five-day-card');
  card.setAttribute('class', 'card bg-primary h-100 text-white');
  cardBody.setAttribute('class', 'card-body p-2');
  cardTitle.setAttribute('class', 'card-title');
  tempEl.setAttribute('class', 'card-text');
  windEl.setAttribute('class', 'card-text');
  humidityEl.setAttribute('class', 'card-text');

  cardTitle.textContent = dayjs.unix(unixTs).tz(timezone).format('M/D/YYYY');
  weatherIcon.setAttribute('src', iconUrl);
  weatherIcon.setAttribute('alt', iconDescription);
  tempEl.textContent = `Temp: ${tempF} °F`;
  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;

  forecastEl.append(col);
}

function showForecast(dailyForecast, timezone) {
  var startDt = dayjs().tz(timezone).add(1, 'day').startOf('day').unix();
  var endDt = dayjs().tz(timezone).add(6, 'day').startOf('day').unix();

  var headingCol = document.createElement('div');
  var heading = document.createElement('h4');

  headingCol.setAttribute('class', 'col-12');
  heading.textContent = '5-Day Forecast:';
  headingCol.append(heading);

  forecastEl.innerHTML = '';
  forecastEl.append(headingCol);
  for (var i = 0; i < dailyForecast.length; i++) {
  
    if (dailyForecast[i].dt >= startDt && dailyForecast[i].dt < endDt) {
      renderForecastCard(dailyForecast[i], timezone);
    }
  }
}

function renderItems(city, data) {
  renderCurrentWeather(city, data.current, data.timezone);
  showForecast(data.daily, data.timezone);
}

function fetchWeather(location) {
  var { lat } = location;
  var { lon } = location;
  var city = location.name;
  var apiUrl = `${weatherApi}/data/2.5/onecall?lat=${lat}&lon=${lon}&units=imperial&exclude=minutely,hourly&appid=${weatherKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      renderItems(city, data);
    })
    .catch(function (err) {
      console.error(err);
    });
}

function fetchCoords(search) {
  var apiUrl = `${weatherApi}/geo/1.0/direct?q=${search}&limit=5&appid=${weatherKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (!data[0]) {
        alert('Location not found');
      } else {
        appendToHistory(search);
        fetchWeather(data[0]);
      }
    })
    .catch(function (err) {
      console.error(err);
    });
}

function handleSearchFormSubmit(e) {
  if (!searchInputEl.value) {
    return;
  }

  e.preventDefault();
  var search = searchInputEl.value.trim();
  fetchCoords(search);
  searchInputEl.value = '';
}

function handleSearchHistoryClick(e) {
  
  if (!e.target.matches('.btn-history')) {
    return;
  }

  var btn = e.target;
  var search = btn.getAttribute('data-search');
  fetchCoords(search);
}

initSearchHistory();
form.addEventListener('submit', handleSearchFormSubmit);
searchEl.addEventListener('click', handleSearchHistoryClick);
