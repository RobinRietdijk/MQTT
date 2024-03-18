import Aedes from 'aedes';
import { Listener } from './Listener';
import { ValidationError } from './utils/errors';

import fs from 'fs';
import YAML from 'yaml';
import { initPersistence } from './utils/persistence';

const DEFAULT_CONFIG_PATH = '@@/config.ini';

export class MultiBroker {
    private configPath: string;
    private config: any;

    private broker!: Aedes;
    private listeners: { [key: string]: Listener } = {};

    constructor(
        config?: string,
    ) {
        this.configPath = config || DEFAULT_CONFIG_PATH;

        this.loadConfig();
        this.initAedes();
    }

    private loadConfig(): void {
        try {
            const data = fs.readFileSync(this.configPath, 'utf-8');
            this.config = YAML.parse(data);
        } catch (error) {
            let message = 'Unknown error';
            if (error instanceof Error) message = error.message;
            throw new Error('Failed to load configuration file: ' + message);
        }
    }

    private async initAedes(): Promise<Aedes> {
        try {
            const { mq, persistence } = await initPersistence(this.config.aedes);
            const aedesOpts: { [key: string]: any } = {
                persistence,
                mq
            };

            aedesOpts.id = this.config.aedes.id;
            aedesOpts.concurrency = this.config.aedes.concurrency;
            aedesOpts.queueLimit = this.config.aedes.queueLimit;
            aedesOpts.maxClientsIdLength = this.config.aedes.maxClientsIdLength;
            aedesOpts.heartbeatInterval = this.config.aedes.heartbeatInterval;
            aedesOpts.connectTimeout = this.config.aedes.connectTimeout;
            aedesOpts.keepAliveLimit = this.config.aedes.keepAliveLimit;

            const broker = new Aedes(aedesOpts);
            return broker;
        } catch (error) {
            let message = 'Unknown error';
            if (error instanceof Error) message = error.message;
            throw new Error('Failed to initialize Aedes broker: ' + message);
        }
    }

    public async waitUntilReady(): Promise<void> {
        await this.initAedes();
    }

    public getBroker(): Aedes {
        return this.broker;
    }

    public async start(): Promise<void> {
        const serverOpts: { [key: string]: any } = {};
        const isSecure = this.config.servers.some((server: { [key: string]: any }) => ['tls', 'wss'].includes(server.protocol));

        if (isSecure) {
            if (this.config.secureOptions.cert && this.config.secureOptions.key) {
                serverOpts.key = fs.readFileSync(this.config.key)
                serverOpts.cert = fs.readFileSync(this.config.cert)
                serverOpts.rejectUnauthorized = this.config.rejectUnauthorized
            } else {
                throw new ValidationError('Must supply both private key and signed certificate to create secure aedes server');
            }
        }

        const promises: Promise<void>[] = [];
        for (const key in this.config.servers) {
            const server = this.config.servers[key];
            const listener = new Listener(server.port, server.server, serverOpts, this.broker);
            this.listeners[key] = listener;
            promises.push(listener.start());
        }

        await Promise.all(promises);
    }

    public async stop(): Promise<void> {
        const promises: Promise<void>[] = [];
        for (const listener of Object.values(this.listeners)) {
            promises.push(listener.stop());
        }

        await Promise.all(promises);
    }

    public async restart(): Promise<void> {
        await this.stop();
        await this.start();
    }
}
