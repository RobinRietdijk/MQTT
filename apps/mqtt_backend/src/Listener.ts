import Aedes from "aedes/types/instance";
import { ListenerConfig, Protocol } from "./utils/types";
import { createServer } from "aedes-server-factory";
import { SecureContextOptions, Server as TLSServer } from "tls";
import { NotListening, ShutdownError, StartupError, ValidationError, defaultErrorHandler } from "./utils/errors";

export class Listener {
    private id: string;
    private broker: ReturnType<typeof createServer>;

    constructor(private port: number, private protocol: Protocol, private config: ListenerConfig, private aedes: Aedes) {
        this.validateServerOptions(protocol, config);
        this.id = `${protocol}:${port}`;
        this.broker = createServer(aedes, this.config);
    }


    public getId(): string {
        return this.id;
    }

    public getPort(): number {
        return this.port;
    }

    public getProtocol(): Protocol {
        return this.protocol;
    }

    public getConfig(): ListenerConfig {
        return this.config;
    }

    public getBroker(): ReturnType<typeof createServer> {
        return this.broker;
    }

    public isListening(): boolean {
        return this.broker.listening;
    }

    public async start(): Promise<void> {
        if (this.isListening()) {
            throw new StartupError(`${this.id} - Listenner is already listening`);
        }

        await new Promise<void>((resolve, reject) => {
            this.broker.listen(this.port, () => {
                console.log(`${this.id} - Listening on port ${this.port}`);
                resolve();
            }).on('error', async (error: Error) => {
                try {
                    await this.stop();
                } catch (stopError: unknown) {
                    const message = defaultErrorHandler('`${this.id} - Failed to stop the listener after a start error:')
                    error.message += ` | Stop error: ${message}`;
                }

                const startupError = new StartupError(`${this.id} - Failed to listen on port ${this.port}: ${error.message}`);
                startupError.stack += '\nCaused by: ' + error.stack;
                reject(startupError);
            });
        });
    }

    public async stop(): Promise<void> {
        if (!this.isListening()) {
            throw new NotListening(`${this.id} - Listener is already stopped`);
        }

        await new Promise<void>((resolve, reject) => {
            this.broker.close((error) => {
                if (error) {
                    const shutdownError = new ShutdownError(`${this.id} - Failed to stop: ${error.message}`);
                    shutdownError.stack += '\nCaused by: ' + error.stack;
                    reject(shutdownError);
                } else {
                    console.log(`${this.id} - Listener stopped successfully`);
                    resolve();
                }
            });
        });
    }

    public setSecureContext(context: SecureContextOptions): void {
        if (this.protocol !== 'tls' && this.protocol !== 'wss')
            throw new ValidationError(
                `${this.id} - Secure context can only be set for 'mqtts' and 'wss' protocols`,
            );

        const broker = this.broker as TLSServer;
        broker.setSecureContext(context);

        if (this.protocol === 'tls')
            this.config.tls = { ...this.config.tls, ...context };
        else if (this.protocol === 'wss')
            this.config.https = {
                ...this.config.https,
                ...context,
            };
    }

    private validateServerOptions(
        protocol: Protocol,
        serverOptions: ListenerConfig,
    ): void {
        const { tls, ws, https } = serverOptions;

        const errors = {
            tcp: () =>
                tls || ws
                    ? `${this.id} - TLS and WS options are not allowed for the MQTT protocol`
                    : '',
            tls: () =>
                !tls ? `${this.id} - TLS options must be provided for the MQTTS protocol` : '',
            ws: () =>
                tls || !ws
                    ? `${this.id} - WS must be set to true for the WS protocol, and TLS must be absent`
                    : '',
            wss: () =>
                !!tls || !ws || !https
                    ? `${this.id} - TLS Must be absent, HTTPS must be provided and WS must be set to true for the WSS protocol`
                    : '',
        };

        const error = errors[protocol]?.();
        if (error) {
            throw new ValidationError(error);
        }
        if (!errors[protocol]) {
            throw new ValidationError('Unsupported protocol specified.');
        }
    }
}