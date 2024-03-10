import { Listener } from "@/Listener";
import { MultiBroker } from "@/MultiBroker";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

describe('MultiBroker', () => {
    let multiBroker: MultiBroker;

    beforeEach(() => {
        multiBroker = new MultiBroker();
    });

    afterEach(() => {
        multiBroker.getBroker().close();
        multiBroker.stopAll();
    });

    describe('addListener', () => {
        it('should add a listener without errors', () => {
            multiBroker.addListener(0, 'tcp', {});

            expect(Object.values(multiBroker.getListeners()).length).toBeGreaterThan(0);
        });

        it('should throw an error when a port is already taken', () => {
            const listener = new Listener(0, 'tcp', {}, multiBroker.getBroker());
            multiBroker.addListener(listener);

            expect(multiBroker.addListener(listener)).toThrow();
        });

        it('should handle an error when adding a listener fails', () => {
            multiBroker.addListener(0, 'tcp', {});

            expect(Object.values(multiBroker.getListeners()).length).toBeGreaterThan(0);
        });
    });

    describe('removeListener', () => {
        it('', () => {

        });
    });

    describe('start', () => {
        it('', () => {

        });
    });

    describe('stop', () => {
        it('', () => {

        });
    });

    describe('startAll', () => {
        it('', () => {

        });
    });

    describe('stopAll', () => {
        it('', () => {

        });
    });

    describe('setSecureContext', () => {
        it('', () => {

        });
    });
});