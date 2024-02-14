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

  public start(cb: (error?: Error) => void): void {
    this.aedes = new Aedes(this.aedesOptions);
    this.broker = createServer(this.aedes.handle, this.serverOptions);
    this.broker
      .listen(this.port, () => {
        console.log(`Broker running on port ${this.port}`);
        cb();
      })
      .on("error", (err) => {
        console.log(`Failed to start broker on port ${this.port}:`, err);
        cb(err);
      });
  }

  public async close(cb: (error?: Error) => void): Promise<void> {
    if (!this.broker || !this.aedes) {
      cb(new Error("Server is not running"));
      return;
    }
    const broker = this.broker;
    await new Promise<void>((resolve, reject) =>
      broker.close((err) => {
        if (err) reject(err);
        else resolve();
      }),
    );
    this.aedes.close();
    this.broker = undefined;
    this.aedes = undefined;
  }
}
