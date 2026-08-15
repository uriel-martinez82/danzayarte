export interface Alumno {
  nombre: string;
  apellido: string;
  dni: string;
}

export interface Responsable {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
}

export interface AutorizacionPayload {
  alumno: Alumno;
  responsable: Responsable;
  numero: 1 | 2;
}

export interface Turno {
  fecha: string;  // ISO date string
  horario: string; // "HH:MM"
}
