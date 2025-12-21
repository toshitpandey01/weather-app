from flask import Flask, render_template, request, jsonify
import requests
import os

app = Flask(__name__)
API_KEY = "27df5b29bee067875f61544bf73b9911"


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/weather', methods=['POST'])
def get_weather():
    try:
        city = request.json.get('city', '').strip()
        if not city:
            return jsonify({'error': 'City name required'}), 400

        # Get coordinates
        geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={API_KEY}"
        geo_response = requests.get(geo_url, timeout=5).json()

        if not geo_response:
            return jsonify({'error': f'City "{city}" not found'}), 404

        lat, lon = geo_response[0]['lat'], geo_response[0]['lon']
        city_name = geo_response[0].get('name', city)

        # Current weather
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        weather_data = requests.get(weather_url, timeout=5).json()

        main = weather_data['main']
        weather = weather_data['weather'][0]
        wind = weather_data['wind']

        # AQI
        aqi_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API_KEY}"
        try:
            aqi_data = requests.get(aqi_url, timeout=5).json()
            aqi = aqi_data['list'][0]['main']['aqi']
        except:
            aqi = None

        # 5-day forecast
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        forecast_data = requests.get(forecast_url, timeout=5).json()
        forecast_list = []

        for item in forecast_data['list'][:40:8]:  # Every 24h for 5 days
            forecast_list.append({
                'date': item['dt_txt'][:10],
                'description': item['weather'][0]['description'],
                'temp': round(item['main']['temp']),
                'icon': item['weather'][0]['icon']
            })

        return jsonify({
            'city': city_name,
            'description': weather['description'],
            'icon': weather['icon'],
            'temperature': round(main['temp']),
            'feels_like': round(main['feels_like']),
            'temp_min': round(main.get('temp_min', main['temp'])),
            'temp_max': round(main.get('temp_max', main['temp'])),
            'humidity': main['humidity'],
            'wind_speed': round(wind.get('speed', 0)),
            'pressure': main.get('pressure'),
            'visibility': weather_data.get('visibility', 0) / 1000,
            'aqi': aqi,
            'forecast': forecast_list
        })

    except Exception as e:
        return jsonify({'error': f'Weather service error: {str(e)}'}), 500


if __name__ == '__main__':
    print("🌤️ Professional Weather App Starting...")
    app.run(debug=True, port=5000)
