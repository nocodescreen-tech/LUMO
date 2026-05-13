const axios = require('axios');
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const jar = new tough.CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

async function run() {
  try {
    const csrfRes = await client.get('http://localhost:5001/api/csrf-token');
    
    // Extract token from cookie string manually
    const cookies = await jar.getCookies('http://localhost:5001');
    const xsrfCookie = cookies.find(c => c.key === 'XSRF-TOKEN');
    const csrfToken = xsrfCookie ? xsrfCookie.value : '';

    const loginRes = await client.post('http://localhost:5001/api/auth/login', {
      email: 'no.codescreen@gmail.com',
      motDePasse: 'Lumo@2026!'
    }, {
      headers: { 'X-XSRF-TOKEN': csrfToken }
    });
    const token = loginRes.data.token;
    console.log('Login success');

    const putRes = await client.put('http://localhost:5001/api/auth/profile', {
      nom: 'rene_test_123',
      telephone: '+24399999999',
      entreprise: { nom: 'entreprise test' },
      preferences: { theme: 'dark' }
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-XSRF-TOKEN': csrfToken
      }
    });
    console.log('Update response:', putRes.data.nom);

    // Let's get the profile again to be sure
    const getRes = await client.get('http://localhost:5001/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Get response:', getRes.data.user.nom);

  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
run();
