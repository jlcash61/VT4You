// public/js/services/weatherService.js

const weatherDescriptions = {
  0: "Clear sky",
  1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Icy fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers", 81: "Showers", 82: "Heavy showers",
  85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ heavy hail"
};

function fetchWeather() {
  const weatherUrl =
    "https://api.open-meteo.com/v1/forecast?latitude=37.228384&longitude=-80.423418&current_weather=true";

  fetch(weatherUrl)
    .then((response) => response.json())
    .then((data) => {
      const weather = data.current_weather;
      const tempC = weather.temperature;
      const tempF = (tempC * 9) / 5 + 32;
      const description = weatherDescriptions[weather.weathercode] || "Unknown";

      document.getElementById("weather").innerText =
        `Blacksburg: ${tempF.toFixed(1)}°F, ${description}`;
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
      document.getElementById("weather").innerText = "Weather data not available";
    });
}