import Aedes, { AedesOptions } from "aedes";
import { createServer, ServerFactoryOptions } from "aedes-server-factory";
import { SecureContextOptions, Server as TLSServer } from "tls";

type Protocol = 'mqtt' | 'mqtts' | 'ws' | 'wss';
function validateServerOptions(protocol: Protocol, serverOptions: ServerFactoryOptions): void {
    switch (protocol) {
        case 'mqtt':
            if (!!serverOptions.tls || !!serverOptions.ws) throw new Error('TLS and WS options are not allowed for the mqtt protocol');
            break;
        case 'mqtts':
            if (!serverOptions.tls) throw new Error('TLS options must be provided for mqtts protocol');
            break;
        case "ws":
            if (!!serverOptions.tls || !serverOptions.ws) throw new Error('WS options must be provided for the ws protocol and TLS must be absent');
            break;
        case 'wss':
            if (!!serverOptions.tls || !serverOptions.ws || !serverOptions.https) throw new Error('TLS, WS, and HTTPS options must be provided for the wss protocol');
            break;
        default:
            throw new Error('Invalid protocol');
    }
}
export class Broker {
    private port: number;
    private protocol: Protocol;
    private aedesOptions: AedesOptions;
    private serverOptions: ServerFactoryOptions;
    private aedes?: Aedes;
    private broker?: ReturnType<typeof createServer>;

    constructor(
        port: number,
        protocol: Protocol,
        aedesOptions: AedesOptions = {},
        serverOptions: ServerFactoryOptions = {},
    ) {
        validateServerOptions(protocol, serverOptions);
        this.port = port;
        this.protocol = protocol;
        this.aedesOptions = aedesOptions;
        this.serverOptions = serverOptions;
    }

    // Untested
    public setSecureContext(context: SecureContextOptions): void {
        if (this.protocol !== 'mqtts' && this.protocol !== 'wss') throw new Error("Secure context can only be set for 'mqtts' and 'wss' protocols.");
        if (!this.broker) throw new Error("Server is not initialized.");
        const broker = this.broker as TLSServer;

        //TODO: Replace context in serverOptions
        
        broker.setSecureContext(context);
    }

    // Untested
    public isListening(): boolean {
        return !!this.broker && this.broker.listening;
    }

    // Untested
    public async updateConfig(
        protocol?: Protocol,
        port?: number,
        aedesOptions?: AedesOptions,
        serverOptions?: ServerFactoryOptions,
    ): Promise<void> {
        if (!protocol && !port && !aedesOptions && !serverOptions) return;
        validateServerOptions(protocol || this.protocol, serverOptions || this.serverOptions);

        if (protocol) this.protocol = protocol;
        if (port) this.port = port;
        if (aedesOptions) this.aedesOptions = aedesOptions;
        if (serverOptions) this.serverOptions = serverOptions;

        if (this.isListening()) {
            await this.close();
            await this.start();
        }
    }

    public async start(): Promise<void> {
        this.aedes = new Aedes(this.aedesOptions);
        this.broker = createServer(this.aedes, this.serverOptions);

        await new Promise<void>((resolve, reject) => {
            this.broker!.listen(this.port, () => {
                console.log(`Broker running on port ${this.port}`);
                resolve();
            }).on("error", async (err: Error) => {
                console.log(`Failed to start broker on port ${this.port}:`, err.message);
                await this.close().then(() => reject(err));
            });
        });
    }

    public async close(): Promise<void> {
        if (!this.broker && !this.aedes) {
            console.log('Broker or Aedes instances are already closed or were never initialized');
            return;
        }

        if (this.broker) {
            if (this.broker.listening) {
                await new Promise<void>((resolve, reject) => {
                    this.broker!.close((err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            this.broker = undefined;
        }

        if (this.aedes) {
            // Ignoring 'reject' because 'Aedes.prototype.close' does not provide an error callback.
            // This promise ensures completion of the close operation without error handling.
            //
            // eslint-disable-next-line no-unused-vars
            await new Promise<void>((resolve, reject) => {
                this.aedes!.close(() => resolve());
            });
            this.aedes = undefined;
        }
    }
}
