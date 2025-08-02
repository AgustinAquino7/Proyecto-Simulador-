const turnos = [];
const especialidades = ["Clínica", "Pediatría", "Odontología"];

function iniciarSimulador() {
  alert("Bienvenido al simulador de turnos médicos");
  let continuar = true;

  while (continuar) {
    const nombre = prompt("Ingrese su nombre:");
    if (!nombre) {
      alert("Nombre no válido");
      continue;
    }

    const dni = prompt("Ingrese su DNI (solo números):");
    if (!dni || isNaN(dni) || dni.trim() === "") {
      alert("⚠️ DNI no válido");
      continue;
    }

    let mensajeEsp = "Especialidades disponibles:\n";
    especialidades.forEach((esp, i) => {
      mensajeEsp += `${i + 1}. ${esp}\n`;
    });

    let opcion = parseInt(prompt(mensajeEsp + "Seleccione una opción (1-3):"));
    if (opcion < 1 || opcion > especialidades.length || isNaN(opcion)) {
      alert("Especialidad inválida");
      continue;
    }

    const especialidad = especialidades[opcion - 1];
    const fecha = prompt("Ingrese la fecha del turno (formato: AAAA-MM-DD):");
    const hora = prompt("Ingrese la hora del turno (formato: HH:MM):");

    const confirmacion = confirm(
      `¿Confirmar turno?\n\nNombre: ${nombre}\nDNI: ${dni}\nEspecialidad: ${especialidad}\nFecha: ${fecha}\nHora: ${hora}`
    );

    if (confirmacion) {
      const turno = { nombre, especialidad, fecha, hora };
      turnos.push(turno);
      alert("✅ Turno reservado con éxito");
      console.log("🔖 Turno guardado:", turno);
    } else {
      alert("❌ Turno cancelado");
    }

    continuar = confirm("¿Desea reservar otro turno?");
  }

  mostrarTurnos();
}

function mostrarTurnos() {
  console.log("📋 Lista de turnos registrados:");
  if (turnos.length === 0) {
    console.log("No hay turnos reservados.");
  } else {
    turnos.forEach((turno, index) => {
      console.log(
        `${index + 1}. ${turno.nombre} - ${turno.especialidad} - ${
          turno.fecha
        } a las ${turno.hora}`
      );
    });
  }
}
