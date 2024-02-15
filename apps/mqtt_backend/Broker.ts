import Aedes, { AedesOptions } from "aedes";
import { createServer, ServerFactoryOptions } from "aedes-server-factory";

export class Broker {
    private port: number;
    private aedesOptions: AedesOptions;
    private serverOptions: ServerFactoryOptions;
    private aedes?: Aedes;
    private broker?: ReturnType<typeof createServer>;

    constructor(
        port: number,
        aedesOptions: AedesOptions = {},
        serverOptions: ServerFactoryOptions = {},
    ) {
        this.port = port;
        this.aedesOptions = aedesOptions;
        this.serverOptions = serverOptions;
    }

    public updateOptions(
        aedesOptions?: AedesOptions,
        serverOptions?: ServerFactoryOptions,
    ): void {
        throw new Error("Not yet implemented");
    }

    public async start(): Promise<void> {
        this.aedes = new Aedes();
        this.broker = createServer(this.aedes, this.serverOptions);

        await new Promise<void>((resolve, reject) => {
            this.broker!.listen(this.port, () => {
                console.log(`Broker running on port ${this.port}`);
                resolve();
            }).on("error", async (err) => {
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
            await new Promise<void>((resolve, reject) => {
                this.aedes!.close(() => resolve());
            });
            this.aedes = undefined;
        }
    }
}
