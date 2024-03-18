import Aedes, { AedesOptions } from 'aedes';
import { Listener } from './Listener';
import { ListenerConfig, Protocol } from './utils/types';
import { KeyError, ValidationError, defaultErrorHandler, ShutdownError } from './utils/errors';
import { SecureContextOptions } from 'tls';

import fs from 'fs';
import YAML from 'yaml';
import { initPersistence } from './utils/persistence';

const DEFAULT_CONFIG_PATH = '@@/config.ini';

export class MultiBroker {
    private configPath: string;
    private config: any;

    private broker!: Aedes;
    private listeners: { [port: number]: Listener } = {};

    constructor(
        config?: string,
    ) {
        this.configPath = config || DEFAULT_CONFIG_PATH;

        this.config = this.readConfig();
        this.initAedes().then((broker) => {
            this.broker = broker;
        });
    }

    private readConfig(): any {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        return YAML.parse(data);
    }

    private async initAedes(): Promise<Aedes> {
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
    }

    public getBroker(): Aedes {
        return this.broker;
    }
    
    public start(): void {
        const serverOpts: { [key: string]: any } = {};
        const isSecure = this.config.tls.enabled || this.config.wss.enabled;

        if (isSecure) {
            if (this.config.secureOptions.cert && this.config.secureOptions.key) {
                serverOpts.key = fs.readFileSync(this.config.key)
                serverOpts.cert = fs.readFileSync(this.config.cert)
                serverOpts.rejectUnauthorized = this.config.rejectUnauthorized
            }
            throw new Error('Must supply both private key and signed certificate to create secure aedes server')
        }

        
    }

    public stop(): void {

    }

    public restart(): void {

    }
}
