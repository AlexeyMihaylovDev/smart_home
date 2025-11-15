// Простой скрипт для тестирования подключения к Home Assistant
// Запустите: node test-connection.js

const axios = require('axios');

const HA_URL = 'http://192.168.3.12:8123';
const HA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJlNmRmNjgxMmEzODE0NDFmYWFlMzVlOWE3MTIzM2I2YiIsImlhdCI6MTc2MzIxNTA4NSwiZXhwIjoyMDc4NTc1MDg1fQ.qCvYlbMPKYTwXB6U6teLtFz9i2auZmnPPpvwz_k8dUY';

async function testConnection() {
  try {
    console.log('Проверка подключения к Home Assistant...');
    console.log('URL:', HA_URL);
    
    const response = await axios.get(`${HA_URL}/api/`, {
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
    console.log('✅ Подключение успешно!');
    console.log('Статус:', response.status);
    console.log('Данные:', response.data);
    
    // Попробуем получить список состояний
    const statesResponse = await axios.get(`${HA_URL}/api/states`, {
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
      },
    });
    
    console.log('\n✅ Получение состояний успешно!');
    console.log('Количество сущностей:', statesResponse.data.length);
    
  } catch (error) {
    console.error('❌ Ошибка подключения:');
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Данные:', error.response.data);
    } else if (error.request) {
      console.error('Запрос отправлен, но ответа нет. Проверьте:');
      console.error('1. Доступность сервера по адресу', HA_URL);
      console.error('2. Правильность IP адреса');
      console.error('3. Работает ли Home Assistant');
    } else {
      console.error('Ошибка:', error.message);
    }
  }
}

testConnection();

