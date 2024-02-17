import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals'
import { Broker } from '../Broker';
import * as BrokerFunctions from '../Broker';
import fs from 'fs';
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
        broker = new Broker(8883, 'mqtts', {}, { tls: {} });
    });

    afterEach(async () => {
        await broker.close();
    });

    describe('constructor', () => {
        it('should initialize the broker with provided configuration', () => {
            expect(broker).toBeDefined();
            expect(broker.getPort()).toBe(8883);
            expect(broker.getProtocol()).toBe('mqtts');
            expect(broker.getAedesOptions()).toEqual({});
            expect(broker.getServerOptions()).toEqual({ tls: {} });
        });

        it('should throw an error for invalid configurations', () => {
            expect(() => new Broker(8883, 'mqtts', {}, { ws: true })).toThrow();
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
            const secondBroker = new Broker(8883, 'mqtts', {}, { tls: {} });
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
        it('should update TLS options and set secure context', () => {
            const context = getCert();
            broker.setSecureContext(context);
            expect(broker.getServerOptions().tls).toEqual(context);
        });

        it('should update TLS options and set secure context whilst server is running', async () => {
            await broker.start();
            const context = getCert();
            broker.setSecureContext(context);
            expect(broker.getServerOptions().tls).toEqual(context);
            expect(broker.isListening).toBeTruthy();
        });
    });

    describe('updateConfig', () => {
        it('should update the broker configuration', async () => {
            await broker.start();
            await broker.updateConfig('mqtt', 1883, {}, {});
            expect(broker.getProtocol()).toEqual('mqtt');
            expect(broker.getPort()).toEqual(1883);
            expect(broker.getAedesOptions()).toEqual({});
            expect(broker.getServerOptions()).toEqual({});
        });

        it('should throw error on wrong configuration', async () => {
            await broker.start();
            expect(broker.updateConfig('mqtt', 1883, {}, { ws: true })).rejects.toThrow();
        });

        it('should restart the broker if already listening', async () => {
            const startSpy = jest.spyOn(broker, 'start');
            const closeSpy = jest.spyOn(broker, 'close');
            await broker.start();
            await broker.updateConfig('mqtt', 1883, {}, {});
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
