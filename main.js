const form = document.getElementById("formTurno");
const lista = document.getElementById("listaTurnos");


document.addEventListener("DOMContentLoaded", () => {
  const turnosGuardados = JSON.parse(localStorage.getItem("turnos")) || [];
  turnosGuardados.forEach(turno => mostrarTurno(turno));
});


form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const dni = document.getElementById("dni").value.trim();
  const especialidad = document.getElementById("especialidad").value;
  const obraSocial = document.getElementById("obraSocial").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  if (!nombre || !dni || !fecha || !hora || !obraSocial) {
    alert("⚠️ Todos los campos son obligatorios");
    return;
  }

  const turno = { nombre, dni, especialidad, obraSocial, fecha, hora };

  mostrarTurno(turno);
  guardarTurno(turno);

  alert("✅ Turno reservado con éxito");
  form.reset();
});


function mostrarTurno(turno) {
  const item = document.createElement("li");
  item.textContent = `${turno.nombre} (DNI: ${turno.dni}) - ${turno.especialidad} - ${turno.obraSocial} - ${turno.fecha} a las ${turno.hora}`;

  
  const btnEliminar = document.createElement("button");
  btnEliminar.textContent = "❌";
  btnEliminar.style.marginLeft = "1rem";
  btnEliminar.onclick = () => eliminarTurno(turno, item);

  item.appendChild(btnEliminar);
  lista.appendChild(item);
}


function guardarTurno(turno) {
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  turnos.push(turno);
  localStorage.setItem("turnos", JSON.stringify(turnos));
}


function eliminarTurno(turno, itemElemento) {
  if (confirm(`¿Eliminar turno de ${turno.nombre}?`)) {
    itemElemento.remove();

    let turnos = JSON.parse(localStorage.getItem("turnos")) || [];
    turnos = turnos.filter(t =>
      !(t.nombre === turno.nombre && t.dni === turno.dni && t.fecha === turno.fecha && t.hora === turno.hora && t.obraSocial === turno.obraSocial))
    ;
    localStorage.setItem("turnos", JSON.stringify(turnos));
  }
}
