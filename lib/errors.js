/** Error de validacion: datos que el usuario escribio mal (HTTP 400). */
export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = 400
  }
}

/** Conflicto con el estado actual (por ejemplo, ya hay una cuenta vinculada). HTTP 409. */
export class ConflictError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ConflictError'
    this.statusCode = 409
  }
}
