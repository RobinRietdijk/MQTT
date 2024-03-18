import aedes_persistance from 'aedes-persistence';
import aedes_persistance_redis from 'aedes-persistence-redis';
import aedes_persistance_mongodb from 'aedes-persistence-mongodb';
import mqemitter from "mqemitter";
import mqemitter_redis from "mqemitter-redis";
import mqemitter_mongodb from "mqemitter-mongodb";

import { once } from "events";

const PERSISTENCES: { [key: string ]: any } = {
    redis: {
        waitForReady: true
    },
    mongodb: {
        waitForReady: true
    }
}

export async function initPersistence(config: any) {
    let persistence;
    let mq;

    if (config.persistence) {
        const name = config.persistence.name;
        if (!PERSISTENCES[name]) {
            throw Error('persistence ' + name + ' isn\'t supported');
        } else {
            let module;
            switch(name) {
                case 'redis':
                    module = aedes_persistance_redis;
                    break;
                case 'mongodb':
                    module = aedes_persistance_mongodb;
                    break;
            }
            persistence = module!(config.persistence.options || {});
            persistence.waitForReady = PERSISTENCES[name].waitForReady;
        }
    } else {
        persistence = aedes_persistance()
    }

    if (config.mq) {
        const name = config.mq.name;
        if (!PERSISTENCES[name]) {
            throw Error('mqemitter ' + name + ' isn\'t supported');
        } else {
            let module;
            switch(name) {
                case 'redis':
                    module = mqemitter_redis;
                    break;
                case 'mongodb':
                    module = mqemitter_mongodb;
                    break;
            }
            mq = module!(config.mq.options || {});
            if (name === 'mongodb') {
                await once(mq.status, 'stream');
            }
        }
    } else {
        mq = mqemitter();
    }

    return { mq, persistence };
}