import { beforeEach, describe, it, expect, afterEach } from "@jest/globals";
import { Broker } from "@/Broker";
import { createServer } from "aedes-server-factory";

describe('Broker - base', () => {
    let broker: Broker;

    beforeEach(() => {
        broker = new Broker(0, 'mqtt', {}, {});
    });

    afterEach(() => {
        broker.close();
    });

    describe('Broker - constructor', () => {
        it('should initialize the broker with provided configuration', () => {
            expect(broker).toBeDefined();
            expect(broker.getProtocol()).toBe('mqtt');
            expect(broker.getAedesOptions()).toEqual({});
            expect(broker.getServerOptions()).toEqual({});
        });

        it('should throw an error for invalid configurations', () => {
            expect(() => new Broker(0, 'mqtt', {}, { tls: {} })).toThrow();
        });
    });

    describe('Broker - isListening', () => {
        it('should return true if the broker is listening', async () => {
            await broker.start();
            expect(broker.isListening()).toBeTruthy();
        });

        it('should return false if the broker has not been started', async () => {
            expect(broker.isListening()).toBeFalsy();
        });

        it('should return false if the broker is not listening', async () => {
            broker['broker'] = { listening: false } as unknown as ReturnType<typeof createServer>;
            expect(broker.isListening()).toBeFalsy();
        });
    });
});