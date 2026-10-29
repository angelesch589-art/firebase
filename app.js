/**
 * Lógica Frontend para Limpieza Automatizada de Cuentas en Firebase
 * Estudiante: María Chamorro (Ficha 03/12 - Nivel Avanzado)
 */

let currentUser = null;
let documents = [];

// Elementos del DOM
const authStatusText = document.getElementById('authStatusText');
const authBadgeDot = document.querySelector('.status-dot');
const currentUserBox = document.getElementById('currentUserBox');
const currentUserName = document.getElementById('currentUserName');
const currentUserEmail = document.getElementById('currentUserEmail');
const currentUid = document.getElementById('currentUid');
const docCountBadge = document.getElementById('docCountBadge');
const tableBody = document.getElementById('tableBody');
const alertBox = document.getElementById('alertBox');
const alertTitle = document.getElementById('alertTitle');
const alertMessage = document.getElementById('alertMessage');
const alertIcon = document.getElementById('alertIcon');

const btnLoginMaria = document.getElementById('btnLoginMaria');
const btnLoginCarlos = document.getElementById('btnLoginCarlos');
const btnLogout = document.getElementById('btnLogout');
const btnAddTestData = document.getElementById('btnAddTestData');
const btnRefreshDocs = document.getElementById('btnRefreshDocs');
const btnDeleteAccount = document.getElementById('btnDeleteAccount');

// Datos para la prueba obligatoria de aislamiento (Sección C)
const USERS = {
  maria: {
    uid: 'usr_maria_a1b2',
    name: 'María Chamorro',
    email: 'maria@demo.com',
    docs: [
      { id: 'usr_maria_a1b2', col: 'users', title: 'Perfil de María Chamorro' },
      { id: 'post_m101', col: 'posts', title: 'Investigación: Triggers en Cloud Functions' },
      { id: 'post_m102', col: 'posts', title: 'Manejo de Idempotencia en Bases NoSQL' },
      { id: 'post_m103', col: 'posts', title: 'Batched Writes y límites de 500 ops' },
      { id: 'ord_m881', col: 'orders', title: 'Suscripción de Plataforma Cloud #881' },
      { id: 'file_m01', col: 'files', title: 'diagrama_arquitectura_limpieza.png' },
      { id: 'notif_m01', col: 'notifications', title: 'Bienvenida al laboratorio de Firebase' }
    ]
  },
  carlos: {
    uid: 'usr_carlos_c3d4',
    name: 'Carlos Mendoza',
    email: 'carlos@demo.com',
    docs: [
      { id: 'usr_carlos_c3d4', col: 'users', title: 'Perfil de Carlos Mendoza' },
      { id: 'post_c201', col: 'posts', title: 'Tutorial de React 19 y Tailwind' },
      { id: 'post_c202', col: 'posts', title: 'Despliegues en Firebase Hosting' },
      { id: 'ord_c992', col: 'orders', title: 'Curso de Especialización #992' },
      { id: 'file_c01', col: 'files', title: 'cv_tecnico_carlos.pdf' },
      { id: 'notif_c01', col: 'notifications', title: 'Recordatorio de entrega académica' }
    ]
  }
};

// Inicialización
function init() {
  btnLoginMaria.addEventListener('click', () => login('maria'));
  btnLoginCarlos.addEventListener('click', () => login('carlos'));
  btnLogout.addEventListener('click', logout);
  btnAddTestData.addEventListener('click', addDoc);
  btnRefreshDocs.addEventListener('click', render);
  btnDeleteAccount.addEventListener('click', deleteAccount);
}

// Iniciar sesión
function login(key) {
  currentUser = USERS[key];
  authStatusText.textContent = `Sesión activa (${currentUser.name})`;
  authBadgeDot.classList.add('active');

  currentUserName.textContent = currentUser.name;
  currentUserEmail.textContent = currentUser.email;
  currentUid.textContent = currentUser.uid;
  currentUserBox.style.display = 'flex';

  // Cargar documentos si es la primera vez
  if (!documents.some(d => d.userId === currentUser.uid)) {
    currentUser.docs.forEach(d => {
      documents.push({
        id: d.id,
        collection: d.col,
        userId: currentUser.uid,
        title: d.title,
        status: 'Almacenado en Firestore'
      });
    });
  }

  render();
  showAlert('info', 'Sesión Iniciada', `Conectado como ${currentUser.name}. Puedes ver sus documentos en la tabla.`);
}

// Cerrar sesión
function logout() {
  currentUser = null;
  authStatusText.textContent = 'Sin sesión';
  authBadgeDot.classList.remove('active');
  currentUserBox.style.display = 'none';
  render();
}

// Agregar documento extra
function addDoc() {
  if (!currentUser) return showAlert('warning', 'Aviso', 'Inicia sesión primero.');
  const id = 'doc_' + Math.random().toString(36).substring(2, 6);
  documents.push({
    id,
    collection: 'posts',
    userId: currentUser.uid,
    title: 'Apunte adicional creado por ' + currentUser.name,
    status: 'Almacenado en Firestore'
  });
  render();
  showAlert('success', 'Documento Creado', 'Nuevo documento registrado en Firestore.');
}

// Renderizar tabla
function render() {
  tableBody.innerHTML = '';
  const list = currentUser ? documents.filter(d => d.userId === currentUser.uid) : [];
  docCountBadge.textContent = `${list.length} Documentos`;

  if (list.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          ${currentUser ? 'No hay documentos en Firestore para este usuario.' : 'Inicia sesión para visualizar los documentos.'}
        </td>
      </tr>
    `;
    return;
  }

  list.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge badge-primary">${d.collection}</span></td>
      <td><code>${d.id}</code></td>
      <td><span class="badge ${d.userId.includes('maria') ? 'badge-warning' : 'badge-success'}">${d.userId}</span></td>
      <td><strong>${d.title}</strong></td>
      <td><span class="badge badge-success">${d.status}</span></td>
    `;
    tableBody.appendChild(tr);
  });
}

// Disparar la eliminación de la cuenta (Trigger)
function deleteAccount() {
  if (!currentUser) return showAlert('warning', 'Aviso', 'Inicia sesión con la cuenta a eliminar.');

  const isConfirmed = confirm(
    `¿Estás segura de eliminar la cuenta de ${currentUser.name}?\n\n` +
    `Al confirmar, se ejecuta deleteUser() en Firebase Authentication.\n` +
    `La Cloud Function en el backend capturará el evento y eliminará todos sus documentos en lotes (batches).\n\n` +
    `Los datos del otro usuario NUNCA serán afectados.`
  );

  if (!isConfirmed) return;

  const targetUid = currentUser.uid;
  const targetName = currentUser.name;
  const count = documents.filter(d => d.userId === targetUid).length;

  showAlert('warning', 'Ejecutando Cloud Function...', 'Eliminando credenciales en Auth y ejecutando purga en batches de Firestore...');

  setTimeout(() => {
    // 1. Purgar solo los documentos del usuario eliminado
    documents = documents.filter(d => d.userId !== targetUid);
    const carlosCount = documents.filter(d => d.userId === 'usr_carlos_c3d4').length;

    // 2. Cerrar sesión
    logout();

    // 3. Notificación de éxito
    showAlert(
      'success',
      '¡Limpieza Automatizada Exitosa!',
      `Se eliminó la cuenta de ${targetName} (${targetUid}). Se borraron ${count} documentos en Firestore. Los ${carlosCount} documentos de Carlos permanecen 100% intactos.`
    );
  }, 1200);
}

// Alertas
function showAlert(type, title, msg) {
  alertBox.style.display = 'flex';
  alertTitle.textContent = title;
  alertMessage.textContent = msg;
  alertIcon.textContent = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';

  if (type === 'success') {
    alertBox.style.borderColor = 'rgba(16, 185, 129, 0.5)';
  } else if (type === 'warning') {
    alertBox.style.borderColor = 'rgba(245, 158, 11, 0.5)';
  } else {
    alertBox.style.borderColor = 'rgba(6, 182, 212, 0.5)';
  }
}

document.addEventListener('DOMContentLoaded', init);