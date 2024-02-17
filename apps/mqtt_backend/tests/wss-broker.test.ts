import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals'
import { Broker } from '../Broker';
import fs from 'fs';
import * as BrokerFunctions from '../Broker';
import { Server } from 'net';

function getCert(): { key: Buffer, cert: Buffer } {
    return {
        key: fs.readFileSync('./tests/certificate/key.pem'),
        cert: fs.readFileSync('./tests/certificate/cert.pem')
    };
}

describe("Broker", () => {
    let broker: Broker;

    beforeEach(() => {
        broker = new Broker(8443, 'wss', {}, { ws: true, https: {} });
    });

    afterEach(async () => {
        await broker.close();
    });

    describe('constructor', () => {
        it('should initialize the broker with provided configuration', () => {
            expect(broker).toBeDefined();
            expect(broker.getPort()).toBe(8443);
            expect(broker.getProtocol()).toBe('wss');
            expect(broker.getAedesOptions()).toEqual({});
            expect(broker.getServerOptions()).toEqual({ ws: true, https: {} });
        });

        it('should throw an error for invalid configurations', () => {
            expect(() => new Broker(8443, 'wss', {}, { ws: false })).toThrow();
        });
    });

    describe('start', () => {
        it('should start the broker and listen on the specified port', async () => {
            await broker.start();
            expect(broker.isListening()).toBe(true);
        });

        it('should throw an error if the broker is already running', async () => {
            await broker.start();
            await expect(broker.start()).rejects.toThrow();
        });

        it('should throw an error if the port is already in use', async () => {
            await broker.start();
            const secondBroker = new Broker(8443, 'wss', {}, { ws: true, https: {} });
            expect(secondBroker.start()).rejects.toThrow();
        });
    });

    describe('close', () => {
        it('should close the broker and stop listening', async () => {
            await broker.start();
            expect(broker.isListening()).toBe(true);

            await broker.close();
            expect(broker.isListening()).toBe(false);
        });

        it('should not throw an error if the broker is not initialized', async () => {
            await expect(broker.close()).resolves.not.toThrow();
        });

        it('should throw an error when closing the broker fails', async () => {
            await broker.start();
            const origClose = broker.getBroker()!.close;
            broker.getBroker()!.close = (cb?: (err?: Error) => void): Server => {
                if (typeof cb === 'function') cb(new Error('Broker failed to close'));
                return new Server;
            }

            await expect(broker.close()).rejects.toThrow();
            broker.getBroker()!.close = origClose;
        });
    });

    describe('setSecureContext', () => {
        it('should update HTTPS options and set secure context', () => {
            const context = getCert();
            broker.setSecureContext(context);
            expect(broker.getServerOptions().https).toEqual(context);
        });

        it('should update HTTPS options and set secure context whilst server is running', async () => {
            await broker.start();
            const context = getCert();
            broker.setSecureContext(context);
            expect(broker.getServerOptions().https).toEqual(context);
            expect(broker.isListening).toBeTruthy();
        });
    });

    describe('updateConfig', () => {
        it('should update the broker configuration', async () => {
            await broker.updateConfig('ws', 8080, {}, { ws: true });
            expect(broker.getProtocol()).toEqual('ws');
            expect(broker.getPort()).toEqual(8080);
            expect(broker.getAedesOptions()).toEqual({});
            expect(broker.getServerOptions()).toEqual({ ws: true });
        });

        it('should throw error on wrng configuration', async () => {
            await broker.start();
            expect(broker.updateConfig('ws', 8080, {}, { ws: false })).rejects.toThrow();
        });

        it('should restart the broker if already listening', async () => {
            const startSpy = jest.spyOn(broker, 'start');
            const closeSpy = jest.spyOn(broker, 'close');
            await broker.start();
            await broker.updateConfig('ws', 8080, {}, { ws: true });
            expect(closeSpy).toHaveBeenCalled();
            expect(startSpy).toHaveBeenCalled();
        });

        it('should return when updating nothing', async () => {
            const validateSpy = jest.spyOn(BrokerFunctions, 'validateServerOptions');
            await broker.updateConfig();
            expect(validateSpy).not.toHaveBeenCalled();
        });
    });
});
