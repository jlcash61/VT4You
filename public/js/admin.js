// public/js/admin.js

const ROLES = ['public', 'tech', 'admin'];

let currentAdminUid = null;

document.getElementById('logoutButton').onclick = () => {
  auth.signOut().then(() => { window.location.href = '/'; });
};

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = '/';
    return;
  }

  // Verify the user is actually an admin in Firestore
  try {
    const snap = await db.collection('users').doc(user.uid).get();
    const role = snap.exists ? snap.data().role : 'public';

    if (role !== 'admin') {
      window.location.href = '/';
      return;
    }

    currentAdminUid = user.uid;
    document.getElementById('authStatus').innerText = `${user.email} · admin`;
    loadUsers();

  } catch (err) {
    showError('Failed to verify your role. ' + err.message);
  }
});

async function loadUsers() {
  const loadingMsg = document.getElementById('loadingMsg');
  const errorMsg   = document.getElementById('errorMsg');
  const table      = document.getElementById('userTable');
  const tbody      = document.getElementById('userTableBody');

  loadingMsg.style.display = 'block';
  errorMsg.innerText = '';
  tbody.innerHTML = '';
  table.style.display = 'none';

  try {
    const snap = await db.collection('users').orderBy('email').get();

    snap.forEach((doc) => {
      const data = doc.data();
      const isSelf = doc.id === currentAdminUid;
      tbody.appendChild(buildUserRow(doc.id, data, isSelf));
    });

    loadingMsg.style.display = 'none';
    table.style.display = 'table';

  } catch (err) {
    loadingMsg.style.display = 'none';
    showError('Error loading users: ' + err.message);
  }
}

function buildUserRow(uid, data, isSelf) {
  const tr = document.createElement('tr');
  if (isSelf) tr.classList.add('is-self');

  // Email
  const tdEmail = document.createElement('td');
  tdEmail.textContent = data.email || '(no email)';
  tr.appendChild(tdEmail);

  // Display name
  const tdName = document.createElement('td');
  tdName.textContent = data.displayName || '—';
  tr.appendChild(tdName);

  // Role dropdown
  const tdRole = document.createElement('td');
  const select = document.createElement('select');
  select.className = 'role-select';
  select.disabled = isSelf;

  ROLES.forEach((r) => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    if (r === (data.role || 'public')) opt.selected = true;
    select.appendChild(opt);
  });

  tdRole.appendChild(select);
  tr.appendChild(tdRole);

  // Save button + status
  const tdAction = document.createElement('td');

  if (isSelf) {
    tdAction.innerHTML = '<em style="font-size:12px;color:#999;">your account</em>';
  } else {
    const btn = document.createElement('button');
    btn.className = 'save-btn';
    btn.textContent = 'Save';

    const status = document.createElement('span');
    status.className = 'save-status';

    btn.onclick = () => saveRole(uid, select, btn, status);

    tdAction.appendChild(btn);
    tdAction.appendChild(status);
  }

  tr.appendChild(tdAction);
  return tr;
}

async function saveRole(uid, select, btn, status) {
  const newRole = select.value;

  btn.disabled = true;
  status.className = 'save-status';
  status.textContent = 'Saving…';

  try {
    await db.collection('users').doc(uid).update({ role: newRole });
    status.textContent = '✓ Saved';
  } catch (err) {
    status.className = 'save-status error';
    status.textContent = 'Error: ' + err.message;
    console.error('Save role error:', err);
  } finally {
    btn.disabled = false;
  }
}

function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
}
