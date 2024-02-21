import Aedes, { AedesOptions } from 'aedes';
import { createServer, ServerFactoryOptions } from 'aedes-server-factory';
import { SecureContextOptions, Server as TLSServer } from 'tls';

type Protocol = 'mqtt' | 'mqtts' | 'ws' | 'wss';
export function validateServerOptions(
	protocol: Protocol,
	serverOptions: ServerFactoryOptions,
): void {
	const { tls, ws, https } = serverOptions;

	const errors = {
		mqtt: () =>
			tls || ws
				? 'TLS and WS options are not allowed for the MQTT protocol.'
				: '',
		mqtts: () =>
			!tls ? 'TLS options must be provided for the MQTTS protocol.' : '',
		ws: () =>
			tls || !ws
				? 'WS must be set to true for the WS protocol, and TLS must be absent.'
				: '',
		wss: () =>
			!!tls || !ws || !https
				? 'TLS Must be absent, HTTPS must be provided and WS must be set to true for the WSS protocol.'
				: '',
	};

	const error = errors[protocol]?.();
	if (error) {
		throw new Error(error);
	}
	if (!errors[protocol]) {
		throw new Error('Unsupported protocol specified.');
	}
}

export class Broker {
	private aedes?: Aedes;
	private broker?: ReturnType<typeof createServer>;

	constructor(
		private port: number,
		private protocol: Protocol,
		private aedesOptions: AedesOptions = {},
		private serverOptions: ServerFactoryOptions = {},
	) {
		validateServerOptions(protocol, serverOptions);
	}

	public getPort = (): number => {
		return this.port;
	};
	public getProtocol = (): Protocol => {
		return this.protocol;
	};
	public getAedesOptions = (): AedesOptions => {
		return this.aedesOptions;
	};
	public getServerOptions = (): ServerFactoryOptions => {
		return this.serverOptions;
	};
	public getAedes = (): Aedes | undefined => {
		return this.aedes;
	};
	public getBroker = (): ReturnType<typeof createServer> | undefined => {
		return this.broker;
	};

	public isListening(): boolean {
		return !!this.broker && this.broker.listening;
	}

	public setSecureContext(context: SecureContextOptions): void {
		if (this.protocol !== 'mqtts' && this.protocol !== 'wss')
			throw new Error(
				"Secure context can only be set for 'mqtts' and 'wss' protocols.",
			);

		if (this.broker) {
			const broker = this.broker as TLSServer;
			broker.setSecureContext(context);
		}

		if (this.serverOptions.tls)
			this.serverOptions.tls = { ...this.serverOptions.tls, ...context };
		if (this.serverOptions.https)
			this.serverOptions.https = {
				...this.serverOptions.https,
				...context,
			};
	}

	public async updateConfig(
		protocol?: Protocol,
		port?: number,
		aedesOptions?: AedesOptions,
		serverOptions?: ServerFactoryOptions,
	): Promise<void> {
		if (!protocol && !port && !aedesOptions && !serverOptions) return;

		const saved = {
			protoctol: this.protocol,
			port: this.port,
			aedesOptions: this.aedesOptions,
			serverOptions: this.serverOptions,
		};
		try {
			if (protocol) this.protocol = protocol;
			if (port) this.port = port;
			if (aedesOptions) this.aedesOptions = aedesOptions;
			if (serverOptions) this.serverOptions = serverOptions;
			validateServerOptions(this.protocol, this.serverOptions);
		} catch (err) {
			this.protocol = saved.protoctol;
			this.port = saved.port;
			this.aedesOptions = saved.aedesOptions;
			this.serverOptions = saved.serverOptions;
			throw err;
		}

		if (this.isListening()) {
			await this.close();
			await this.start();
		}
	}

	public async start(): Promise<void> {
		if (this.isListening()) throw new Error('Broker is already running');
		this.aedes = new Aedes(this.aedesOptions);
		this.broker = createServer(this.aedes, this.serverOptions);

		await new Promise<void>((resolve, reject) => {
			this.broker!.listen(this.port, () => {
				console.log(`Broker running on port ${this.port}`);
				resolve();
			}).on('error', async (err: Error) => {
				console.log(
					`Failed to start broker on port ${this.port}:`,
					err.message,
				);
				await this.close().then(() => reject(err));
			});
		});
	}

	public async close(): Promise<void> {
		if (!this.broker && !this.aedes) {
			console.log(
				'Broker or Aedes instances are already closed or were never initialized',
			);
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
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			await new Promise<void>((resolve, reject) => {
				this.aedes!.close(() => resolve());
			});
			this.aedes = undefined;
		}
	}
}
