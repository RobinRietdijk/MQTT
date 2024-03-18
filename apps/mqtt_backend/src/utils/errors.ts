export function defaultErrorHandler(error: unknown): string {
    let message = 'Unknown Error';
    if (error instanceof Error) message = error.message;
    console.error(message, error);
    return message;
}

export class InitializeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InitializeError";
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export class StartupError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "StartUpError"
    }
}

export class ShutdownError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ShutdownError"
    }
}

export class NotListening extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotListening";
    }
}

export class KeyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "KeyError"
    }
}