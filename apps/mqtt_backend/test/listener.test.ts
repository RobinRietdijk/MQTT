import { Listener } from "@/Listener";
import * as errors from "@/utils/errors";
import { describe, it, beforeEach, afterEach, expect, jest } from "@jest/globals";
import { createServer } from "aedes-server-factory";
import Aedes from "aedes";
import { Server } from "net";
import fs from 'fs';
import path from 'path';

function getCert(): { key: Buffer; cert: Buffer } {
	return {
		key: fs.readFileSync(path.resolve(__dirname, './certificate/key.pem')),
		cert: fs.readFileSync(
			path.resolve(__dirname, './certificate/cert.pem'),
		),
	};
}

describe('Listener', () => {
    let aedes: Aedes;
    let listener: Listener;

    beforeEach(() => {
        aedes = new Aedes({});
        listener = new Listener(0, 'tcp', {}, aedes);
    });

    afterEach(async () => {
        aedes.close();
        try {
            await listener.stop();
        } catch(error) {
            if (error !instanceof Error) {
                errors.defaultErrorHandler(error);
            }

            if (error instanceof errors.NotListening) {
                return;
            }

            throw error;
        }
    });


    describe('constructor', () => {
        it('should initialize the broker with provided configuration', () => {
			expect(listener).toBeDefined();
			expect(listener.getProtocol()).toStrictEqual('mqtt');
            expect(listener.getConfig()).toStrictEqual({});
		});

        it('should throw an error for invalid configurations', () => {
			expect(() => new Listener(0, 'tcp', { tls: {} }, aedes)).toThrow();
        });
    });
    describe('isListening', () => {
        it('returns true when the broker is listening', async () => {
			await listener.start();
			expect(listener.isListening()).toBeTruthy();
        });
        it('returns false when the broker is not listening', () => {
			expect(listener.isListening()).toBeFalsy();
        });
    });

    describe('start', () => {
        it('should start the server and listen to the correct port', async () => {
			await listener.start();
			expect(listener.isListening()).toBe(true);
        });

        it('should throw an error when the broker is already listening', async () => {
			await listener.start();
			await expect(listener.start()).rejects.toThrow();
        });

        it('should reject and run close() when the broker fails to start', async () => {
			listener['port'] = 1883;
			await listener.start();
			const secondBroker = new Listener(1883, 'tcp', {}, aedes);
			await expect(secondBroker.start()).rejects.toThrow();
        });

        it('should reject when the broker fails to start and close fails', async () => {
            const defaultErrorHandlerSpy = jest.spyOn(errors, 'defaultErrorHandler');

            const origClose = listener.getBroker().close;
            listener.getBroker().close = (
				cb?: (err?: Error) => void,
			): ReturnType<typeof createServer> => {
				if (typeof cb === 'function')
					cb(new Error('Broker failed to close'));
				return new Server();
			};

			listener['port'] = 1883;
			await listener.start();
			const secondBroker = new Listener(1883, 'tcp', {}, aedes);
			await expect(secondBroker.start()).rejects.toThrow();
            expect(defaultErrorHandlerSpy).toBeCalled();

            listener.getBroker().close = origClose;
        });
    });

    describe('stop', () => {
        it('should stop the server and stop listening', async () => {
			await listener.start();
			expect(listener.isListening()).toBe(true);

			await listener.stop();
			expect(listener.isListening()).toBe(false);
        });

        it('should throw an error if the broker is not listening', async () => {
			await expect(listener.stop()).rejects.toThrow();
        });

        it('should reject if the broker fails to shut down', async () => {
            const origClose = listener.getBroker().close;
			listener.getBroker().close = (
				cb?: (err?: Error) => void,
			): ReturnType<typeof createServer> => {
				if (typeof cb === 'function')
					cb(new Error('Broker failed to close'));
				return new Server();
			};

			await listener.start();
			await expect(listener.stop()).rejects.toThrow();

            listener.getBroker().close = origClose;
        });
    });

    describe('setSecureContext', () => {
        it('should throw an error when trying to set a context for the wrong protocol', () => {
			const context = { key: 'fake-key', cert: 'fake-cert' };
			expect(() => listener.setSecureContext(context)).toThrow();
        });

        it('should set only config.tlswhen protocol is mqtts', () => {
            const mqttsListener = new Listener(0, 'tls', { tls: {} }, aedes);

			const context = getCert();
			mqttsListener.setSecureContext(context);
			expect(mqttsListener.getConfig().tls).toEqual(context);
        });
        it('should set only config.https when protocol is wss', () => {
            const mqttsListener = new Listener(0, 'wss', { ws: true, https: {} }, aedes);

			const context = getCert();
			mqttsListener.setSecureContext(context);
			expect(mqttsListener.getConfig().https).toEqual(context);
        });
    });
});