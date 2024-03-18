import Aedes, { Client } from 'aedes';
import fs from 'fs';
import YAML from 'yaml';
import { initPersistence } from './utils/persistence';
import { Server } from 'net';

const DEFAULT_CONFIG_PATH = '@@/config.ini';

export class Broker {
    private configPath: string;
    private config: any;
    private broker!: Aedes;
    private servers?: [Server];

    constructor() {
        const cfg = process.env.BROKER_CONFIG;
        this.configPath = cfg ? cfg : DEFAULT_CONFIG_PATH;
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

    private startWebsocket(server: any, handle: Client): void {
        const ws = new WebSocket.Server({ server });
        ws.on('connection', function(conn, req) {
            handle(WebSocket.createWebSocketStream(conn), req);
        });
    }

    private async createServer(protocol: string, host: string, port: number, options: any, handle: Client): Promise<any> {
        return new Promise((resolve, reject) => {
            let server: any = null;
            if (protocol === 'tls') {
                server = tls.createServer(options, handle);
            } else if (protocol === 'ws' || protocol === 'wss') {
                server = protocol === 'ws' ? http.createServer() : https.createServer(options);
                startWebsocket(server, handle);
            } else if (protocol === 'tcp') {
                server = net.createServer(handle);
            } else {
                reject(Error('Invalid protocol ' + protocol));
            }

            if (server) {
                server._protocol = protocol;
                server.listen(port, host, (error: Error) => {
                    if (error) reject(error);
                    else resolve(server);

                    console.log('%s server listening on port %s:%d', protocol.toUpperCase(), host, port)
                });
            }
        });
    }

    async start() {
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

        const servers: Partial<[Server]> = [];

        if (this.config.tcp.enabled) {
            servers.push(await this.createServer('tcp', this.config.host, this.config.tcp.enabled, serverOpts, this.broker.handle));
        }
        if (this.config.tls.enabled) {
            servers.push(await this.createServer('tls', this.config.host, this.config.tls.enabled, serverOpts, this.broker.handle));
        }
        if (this.config.ws.enabled) {
            servers.push(await this.createServer('ws', this.config.host, this.config.ws.enabled, serverOpts, this.broker.handle));
        }
        if (this.config.wss.enabled) {
            servers.push(await this.createServer('wss', this.config.host, this.config.wss.enabled, serverOpts, this.broker.handle));
        }

        this.servers = servers as [Server];
    }

    async stop() {

    }

    async restart() {
        await this.stop();
        this.readConfig();
        await this.start();
    }
}