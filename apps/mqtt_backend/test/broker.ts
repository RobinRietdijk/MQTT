import { Listener } from "@/Listener";
import { MultiBroker } from "@/Broker";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

describe('MultiBroker', () => {
    let multiBroker: MultiBroker;

    beforeEach(() => {
        multiBroker = new MultiBroker();
    });

    afterEach(() => {
        multiBroker.getBroker().close();
        multiBroker.stop();
    });

    describe('start', () => {
        it('', () => {

        });
    });

    describe('stop', () => {
        it('', () => {

        });
    });

    describe('setSecureContext', () => {
        it('', () => {

        });
    });
});