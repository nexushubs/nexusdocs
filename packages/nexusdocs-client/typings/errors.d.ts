export declare class ApiError extends Error {
    code: number;
    message: string;
    errors: any;
    constructor(code: number, message: string, errors: any);
}
