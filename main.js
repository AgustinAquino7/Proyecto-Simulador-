const form = document.getElementById('formTurno');
const nombreInput = document.getElementById('nombre');
const dniInput = document.getElementById('dni');
const selectEspecialidad = document.getElementById('especialidad');
const selectLugar = document.getElementById('lugar');
const selectObra = document.getElementById('obraSocial');
const selectHora = document.getElementById('hora');
const fechaInput = document.getElementById('fecha');

const listaTurnos = document.getElementById('listaTurnos');
const filtroEspecialidad = document.getElementById('filtroEspecialidad');
const btnExport = document.getElementById('btnExport');
const btnEstadisticas = document.getElementById('btnEstadisticas');
const btnClearAll = document.getElementById('btnClearAll');
const btnLimpiar = document.getElementById('btnLimpiar');
const chartSection = document.getElementById('chartSection');
const chartCanvas = document.getElementById('chart');

let datosClinica = null;
let turnos = [];
let chartInstance = null;

const LS_KEY = 'simulador_turnos_v1';
const LS_PREFS = 'simulador_turnos_prefs_v1';


async function cargarDatos() {
  try {
    const resp = await fetch('./clinica.json');
    if (!resp.ok) throw new Error('Error cargando datos');
    datosClinica = await resp.json();
  } catch (err) {

    datosClinica = {
      especialidades: ['Clínica Médica', 'Pediatría', 'Odontología'],
      sucursales: ['Sucursal Central'],
      obrasSociales: ['Particular'],
      horariosDisponibles: ['09:00', '10:00', '11:00']
    };
    await Swal.fire({
      icon: 'info',
      title: 'Datos locales',
      text: 'No se pudo cargar clinica.json; se usarán datos por defecto.'
    });
  }

  inicializarUI();
  cargarPrefs();
  cargarTurnosDesdeStorage();
}


function llenarSelect(selectElement, array, placeholder) {
  selectElement.innerHTML = '';
  if (placeholder) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    selectElement.appendChild(opt);
  }
  array.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    selectElement.appendChild(opt);
  });
}

function inicializarUI() {
  llenarSelect(selectEspecialidad, datosClinica.especialidades, 'Seleccionar especialidad');
  llenarSelect(filtroEspecialidad, datosClinica.especialidades, '— Filtrar por especialidad —');
  llenarSelect(selectLugar, datosClinica.sucursales, 'Seleccionar lugar');
  llenarSelect(selectObra, datosClinica.obrasSociales, 'Seleccionar obra social');
  llenarSelect(selectHora, datosClinica.horariosDisponibles, 'Seleccionar hora');


  const hoy = new Date().toISOString().split('T')[0];
  fechaInput.min = hoy;
}


function cargarTurnosDesdeStorage() {
  const json = localStorage.getItem(LS_KEY);
  if (json) {
    try {
      turnos = JSON.parse(json);
      listaTurnos.innerHTML = '';
      turnos.forEach(t => renderTurnoEnLista(t));
    } catch {
      turnos = [];
    }
  }
}

function guardarTurnosEnStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(turnos));
}

function cargarPrefs() {
  const json = localStorage.getItem(LS_PREFS);
  if (!json) return;
  try {
    const prefs = JSON.parse(json);
    if (prefs.nombre) nombreInput.value = prefs.nombre;
    if (prefs.dni) dniInput.value = prefs.dni;
    if (prefs.especialidad) selectEspecialidad.value = prefs.especialidad;
    if (prefs.lugar) selectLugar.value = prefs.lugar;
    if (prefs.obraSocial) selectObra.value = prefs.obraSocial;
  } catch {

  }
}

function guardarPrefs(prefs) {
  localStorage.setItem(LS_PREFS, JSON.stringify(prefs));
}


function validarTurnoForm({ nombre, dni, especialidad, lugar, obraSocial, fecha, hora }) {
  if (!nombre || nombre.trim().length < 3) return 'Nombre inválido (3+ caracteres)';
  if (!dni || !/^\d{6,10}$/.test(dni)) return 'DNI inválido (solo números, 6-10 dígitos)';
  if (!especialidad) return 'Seleccione una especialidad';
  if (!lugar) return 'Seleccione un lugar';
  if (!obraSocial) return 'Seleccione obra social';
  if (!fecha) return 'Seleccione una fecha';
  if (!hora) return 'Seleccione una hora';

  const fechaHora = new Date(`${fecha}T${hora}:00`);
  if (fechaHora < new Date()) return 'No se puede reservar en el pasado';

  const conflicto = turnos.some(t =>
    t.dni === dni && t.fecha === fecha && t.hora === hora && t.lugar === lugar
  );
  if (conflicto) return 'Ya existe un turno para ese DNI en la misma fecha/hora/lugar';
  return null;
}


function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}


function renderTurnoEnLista(turno) {
  const li = document.createElement('li');

  const info = document.createElement('div');
  info.className = 'turno-info';
  info.innerHTML = `
    <strong>${escapeHtml(turno.nombre)}</strong>
    <div class="turno-meta">
      DNI: ${escapeHtml(turno.dni)} • ${escapeHtml(turno.especialidad)} • ${escapeHtml(turno.lugar)} • ${escapeHtml(turno.obraSocial)}
      <br>
      ${escapeHtml(turno.fecha)} • ${escapeHtml(turno.hora)}
    </div>
  `;

  const actions = document.createElement('div');
  actions.className = 'turno-actions';

  const btnDetalles = document.createElement('button');
  btnDetalles.textContent = 'Detalles';
  btnDetalles.className = 'small';
  btnDetalles.addEventListener('click', () => mostrarDetalles(turno));

  const btnEliminar = document.createElement('button');
  btnEliminar.textContent = 'Eliminar';
  btnEliminar.className = 'small danger';
  btnEliminar.addEventListener('click', () => eliminarTurno(turno, li));

  actions.appendChild(btnDetalles);
  actions.appendChild(btnEliminar);

  li.appendChild(info);
  li.appendChild(actions);

  listaTurnos.prepend(li);
}


function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}


function mostrarDetalles(turno) {
  Swal.fire({
    title: `<strong>Turno de ${escapeHtml(turno.nombre)}</strong>`,
    html: `
      <p><b>DNI:</b> ${escapeHtml(turno.dni)}</p>
      <p><b>Especialidad:</b> ${escapeHtml(turno.especialidad)}</p>
      <p><b>Lugar:</b> ${escapeHtml(turno.lugar)}</p>
      <p><b>Obra Social:</b> ${escapeHtml(turno.obraSocial)}</p>
      <p><b>Fecha:</b> ${escapeHtml(turno.fecha)} a las ${escapeHtml(turno.hora)}</p>
    `,
    showCloseButton: true,
    width: 500
  });
}


function eliminarTurno(turno, elementoLi) {
  Swal.fire({
    title: 'Eliminar turno',
    text: `¿Eliminar turno de ${turno.nombre} el ${turno.fecha} a las ${turno.hora}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar'
  }).then(result => {
    if (result.isConfirmed) {
      turnos = turnos.filter(t => t.id !== turno.id);
      guardarTurnosEnStorage();
      elementoLi.remove();
      Swal.fire('Eliminado', 'El turno fue eliminado', 'success');
    }
  });
}


form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nuevo = {
    nombre: nombreInput.value.trim(),
    dni: dniInput.value.trim(),
    especialidad: selectEspecialidad.value,
    lugar: selectLugar.value,
    obraSocial: selectObra.value,
    fecha: fechaInput.value,
    hora: selectHora.value,
    id: generarId()
  };

  const error = validarTurnoForm(nuevo);
  if (error) {
    await Swal.fire({ icon: 'error', title: 'Error', text: error });
    return;
  }

  const confirmed = await Swal.fire({
    title: 'Confirmar reserva',
    html: `<b>${escapeHtml(nuevo.nombre)}</b><br>${escapeHtml(nuevo.especialidad)} — ${escapeHtml(nuevo.lugar)}<br>${escapeHtml(nuevo.fecha)} a las ${escapeHtml(nuevo.hora)}<br>Obra social: ${escapeHtml(nuevo.obraSocial)}`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmed.isConfirmed) {
    await Swal.fire('Cancelado', 'La reserva no se realizó', 'info');
    return;
  }


  turnos.push(nuevo);
  guardarTurnosEnStorage();
  guardarPrefs({
    nombre: nuevo.nombre,
    dni: nuevo.dni,
    especialidad: nuevo.especialidad,
    lugar: nuevo.lugar,
    obraSocial: nuevo.obraSocial
  });

  renderTurnoEnLista(nuevo);

  await Swal.fire({ icon: 'success', title: 'Turno reservado', text: 'Tu turno se guardó correctamente' });

  form.reset();
  cargarPrefs();
  llenarSelect(selectHora, datosClinica.horariosDisponibles, 'Seleccionar hora');
});


filtroEspecialidad.addEventListener('change', () => {
  const val = filtroEspecialidad.value;
  listaTurnos.innerHTML = '';
  const mostrar = val ? turnos.filter(t => t.especialidad === val) : turnos;
  mostrar.forEach(t => renderTurnoEnLista(t));
});


btnExport.addEventListener('click', () => {
  if (!turnos.length) {
    Swal.fire('Sin datos', 'No hay turnos para exportar', 'info');
    return;
  }
  const dataStr = JSON.stringify(turnos, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'turnos_export.json';
  a.click();
  URL.revokeObjectURL(url);
  Swal.fire('Exportado', 'Se descargó turnos_export.json', 'success');
});


btnClearAll.addEventListener('click', () => {
  if (!turnos.length) {
    Swal.fire('Nada que borrar', 'No hay turnos guardados', 'info');
    return;
  }
  Swal.fire({
    title: 'Borrar todo',
    text: '¿Seguro que querés eliminar todos los turnos guardados?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, borrar todo'
  }).then(result => {
    if (result.isConfirmed) {
      turnos = [];
      guardarTurnosEnStorage();
      listaTurnos.innerHTML = '';
      Swal.fire('Listo', 'Se eliminaron todos los turnos', 'success');
    }
  });
});


btnLimpiar.addEventListener('click', () => {
  form.reset();
  cargarPrefs();
  llenarSelect(selectHora, datosClinica.horariosDisponibles, 'Seleccionar hora');
});


btnEstadisticas.addEventListener('click', () => {
  if (!turnos.length) {
    Swal.fire('Sin datos', 'No hay turnos para generar estadísticas', 'info');
    return;
  }
  generarGrafico();
});

function generarGrafico() {
  chartSection.style.display = 'block';

  const freq = {};
  turnos.forEach(t => { freq[t.especialidad] = (freq[t.especialidad] || 0) + 1; });

  const labels = Object.keys(freq);
  const values = labels.map(l => freq[l]);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Turnos',
        data: values,
        backgroundColor: labels.map((_, i) => `rgba(21,101,192,${0.6 - i * 0.02})`)
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, precision: 0 } }
    }
  });

  chartSection.scrollIntoView({ behavior: 'smooth' });
}


cargarDatos();

