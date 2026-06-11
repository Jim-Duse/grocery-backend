//Auth guard
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/';
  throw new Error('Not authenticated');
}

document.body.style.display = 'block';

//DOM
const list = document.getElementById('list');
const form = document.getElementById('add-form');
const nameInput = document.getElementById('name');
const quantityInput = document.getElementById('quantity');
const errorBox = document.getElementById('error');

//Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = '/';
});

//Errors
function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove('hidden');
  setTimeout(() => errorBox.classList.add('hidden'), 3000);
}

//WHO-LOGGED-IN
async function showLoggedUser() {
  const res = await authFetch('/auth/me');
  const data = await res.json();

  const el = document.getElementById('whoami');
  el.textContent = `Welcome ${data.user.display_name}`;
}

//authFetch
async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error(await res.text());
  return res;
}

//API
const getItems = async () => (await authFetch('/items')).json();

const addItem = async (name, quantity) => {
  if (!name.trim()) return showError('Item name required');

  await authFetch('/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, quantity })
  });

  load();
};

const updateStatus = async (id, status) => {
  await authFetch(`/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
};

const deleteItem = async id => {
  await authFetch(`/items/${id}`, { method: 'DELETE' });
};

//Add item
form.addEventListener('submit', async e => {
  e.preventDefault();
  await addItem(nameInput.value, quantityInput.value);
  nameInput.value = '';
  quantityInput.value = '';
  nameInput.focus();
});

function formatDate(date) {
  return new Date(date).toLocaleString();
}
showLoggedUser();
//Render
async function load() {
  const items = await getItems();
  list.innerHTML = '';

  if (!items.length) {
    list.innerHTML = `<div style="text-align:center;color:#aaa">No groceries yet 🧺</div>`;
    return;
  }

  items.forEach(item => {
    const row = document.createElement('div');
    row.className = `item ${item.status === 'BOUGHT' ? 'completed' : ''}`;

    row.innerHTML = `
      <div class="item-main">
        <div class="item-top">
          <span class="item-name">${item.name}</span>
          <span class="item-qty">${item.quantity ? `${item.quantity}` : ''}</span>
        </div>

              <div class="item-meta">
                *${item.updated_by} · On ${formatDate(item.updated_at)}
              </div>
      </div>

        <span class="status">${item.status === 'BOUGHT' ? 'Bought' : 'Needed'}</span>
        <button class="delete">🗑</button>`;

    // Toggle status
    row.querySelector('.status').addEventListener('click', async () => {
      const newStatus = item.status === 'BOUGHT' ? 'NEEDED' : 'BOUGHT';
      await updateStatus(item.id, newStatus);
      load();
    });

    // Delete
    row.querySelector('.delete').addEventListener('click', async () => {
      if (!confirm('Delete this item?')) return;
      await deleteItem(item.id);
      load();
    });

    list.appendChild(row);
  });
}

load();
