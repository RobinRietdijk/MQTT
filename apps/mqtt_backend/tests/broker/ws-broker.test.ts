import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals'
import { Broker } from '../../Broker';
import * as BrokerFunctions from '../../Broker';
import { Server } from 'net';
jest.retryTimes(3);

describe("Broker", () => {
    let broker: Broker;

    beforeEach(() => {
        broker = new Broker(8080, 'ws', {}, { ws: true });
    });

    afterEach(async () => {
        await broker.close();
    });

    describe('Broker - constructor', () => {
        it('should initialize the broker with provided configuration', () => {
            expect(broker).toBeDefined();
            expect(broker.getPort()).toBe(8080);
            expect(broker.getProtocol()).toBe('ws');
            expect(broker.getAedesOptions()).toEqual({});
            expect(broker.getServerOptions()).toEqual({ ws: true });
        });

        it('should throw an error for invalid configurations', () => {
            expect(() => new Broker(8080, 'ws', {}, { tls: {} })).toThrow();
        });
    });

    describe('Broker - start', () => {
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
            const secondBroker = new Broker(8080, 'ws', {}, { ws: true });
            await expect(secondBroker.start()).rejects.toThrow();
        });
    });

    describe('Broker - close', () => {
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

    describe('Broker - setSecureContext', () => {
        it('should throw an error for unsupported protocols', () => {
            const context = { key: 'fake-key', cert: 'fake-cert' };
            expect(() => broker.setSecureContext(context)).toThrow();
        });
    });

    describe('Broker - updateConfig', () => {
        it('should update the broker configuration', async () => {
            await broker.start();
            await broker.updateConfig('mqtt', 1883, {}, { ws: false });
            expect(broker.getProtocol()).toEqual('mqtt');
            expect(broker.getPort()).toEqual(1883);
            expect(broker.getAedesOptions()).toEqual({});
            expect(broker.getServerOptions()).toEqual({ ws: false });
        });

        it('should throw error on wrong configuration', async () => {
            await broker.start();
            await expect(broker.updateConfig('mqtt', 1883, {}, { ws: true })).rejects.toThrow();
        });

        it('should restart the broker if already listening', async () => {
            const startSpy = jest.spyOn(broker, 'start');
            const closeSpy = jest.spyOn(broker, 'close');
            await broker.start();
            await broker.updateConfig('mqtt', 1883, {}, { ws: false });
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
