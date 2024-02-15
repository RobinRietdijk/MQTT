import { describe, beforeEach, afterEach, it, expect } from '@jest/globals'
import { Broker } from '../Broker';

describe("Broker", () => {
    let broker: Broker;

    beforeEach(() => {
        broker = new Broker(1883, 'mqtt');
    });

    afterEach(async () => {
        await broker.close();
    });

    it("starts successfully", async () => {
        await expect(broker.start()).resolves.toBeUndefined();
    });

    it("closes successfully", async () => {
        await broker.start();
        await expect(broker.close()).resolves.toBeUndefined();
    });

    it("handles error when starting on a busy port", async () => {
        await broker.start();
        const secondBroker = new Broker(1883, 'mqtt');

        await expect(secondBroker.start()).rejects.toThrow();
        await secondBroker.close();
    });
});
