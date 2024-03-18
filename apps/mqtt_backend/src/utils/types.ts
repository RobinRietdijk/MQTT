export type { ServerFactoryOptions as ListenerConfig } from "aedes-server-factory";
export type Protocol = 'tcp' | 'tls' | 'ws' | 'wss';

export type Config = {
    protocols: [Protocol],
    tcpPort: number,
    tlsPort: number,
    wsPort: number,
    wssPort: number,
    key: string,
    cert: string,
}