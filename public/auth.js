// ---- REGISTER FROM AUTH JS ----//
document.getElementById('registerForm')?.addEventListener('submit', async e => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const display_name = document.getElementById('display_name').value;
  const password = document.getElementById('password').value;

  const authMessage = document.getElementById('authMessage');

  

  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, display_name, password })
  });

  if (!res.ok) {
    alert('Registration failed');
    return;
  }

  alert('Account created! Please login.');
  window.location.href = '/';
});

// ---- LOGIN FROM AUTH JS ----//
const token = localStorage.getItem('token');

if (token) {
  fetch('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(res => {
    if (res.ok) {
      window.location.href = '/app.html';
    } else {
      localStorage.removeItem('token');
    }
  });
}

document.getElementById('loginForm')?.addEventListener('submit', async e => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  function showAuthMessage(message, type = 'error') {
  authMessage.textContent = message;
  authMessage.className = `auth-message ${type}`;
  }

  function hideAuthMessage() {
    authMessage.textContent = '';
    authMessage.className = 'auth-message hidden';
  }

  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    //alert('Invalid credentials');
    showAuthMessage('Invalid email or password.');
    return;
  }

  const data = await res.json();
  localStorage.setItem('token', data.token);

  window.location.href = '/app.html';
});

