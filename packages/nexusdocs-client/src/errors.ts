export class ApiError extends Error {

  public code: number;
  public message: string;
  public errors: any; 
  constructor(code: number, message: string, errors: any) {
    super();
    this.code = code;
    this.message = message;
    this.errors = errors;
  }
  
}
