export interface FieldError {
  field: string;
  message: string;
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public errors: FieldError[] = []) {
    super(message);
  }
}
