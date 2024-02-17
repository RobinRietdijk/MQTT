import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals'
import { Broker } from '../Broker';

describe("Broker", () => {
    let broker: Broker;

    beforeEach(() => {
        broker = new Broker(1883, 'mqtt');
    });

    afterEach(async () => {
        await broker.close();
    });

    describe('constructor', () => {
        it('should initialize the broker with provided configuration', () => {
            expect(broker).toBeDefined();
            expect(broker.getPort()).toBe(1883);
            expect(broker.getProtocol()).toBe('mqtt');
        });

        it('should throw an error for invalid configurations', () => {
            expect(() => new Broker(1883, 'mqtt', {}, { tls: {} })).toThrow();
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

        it('should throw an error if the port is alreay in use', async () => {
            await broker.start();
            const secondBroker = new Broker(1883, 'mqtt');
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
    });

    describe('setSecureContext', () => {
        it('should throw an error for unsupported protocols', () => {
            const context = { key: 'fake-key', cert: 'fake-cert' };
            expect(() => broker.setSecureContext(context)).toThrow();
        });
    });

    describe('updateConfig', () => {
        it('should update the broker configuration', async () => {
            const newOptions = {
                trustProxy: true
            };
            await broker.updateConfig(undefined, undefined, undefined, newOptions);
            expect(broker.getServerOptions().trustProxy).toEqual(newOptions.trustProxy);
        });

        it('should restart the broker if already listening', async () => {
            const startSpy = jest.spyOn(broker, 'start');
            const closeSpy = jest.spyOn(broker, 'close');
            await broker.start();
            await broker.updateConfig(undefined, undefined, undefined, {});
            expect(closeSpy).toHaveBeenCalled();
            expect(startSpy).toHaveBeenCalled();
        });
    });
});
