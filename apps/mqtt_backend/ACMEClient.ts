import * as acme from 'acme-client';
import * as fs from 'fs';
import { TransIPDNSManager } from './TransIPDNSManager';

export class ACMEClient {
    private client?: acme.Client;
    private accountKey: string | Buffer;
    private directoryUrl: string;

    constructor(private email: string, private domain: string) {
        this.directoryUrl = acme.directory.letsencrypt.staging;
        this.accountKey = '';
    }

    async init() {
        this.accountKey = await this.generateOrLoadAccountKey();
        this.client = new acme.Client({
            directoryUrl: this.directoryUrl,
            accountKey: this.accountKey
        });
    }

    private async generateOrLoadAccountKey(): Promise<string | Buffer> {
        const keyPath = "./accountKey.pem";
        try {
            return fs.readFileSync(keyPath, { encoding: 'utf8' });
        } catch (e) {
            const accountKey = await acme.forge.createPrivateKey();
            fs.writeFileSync(keyPath, accountKey, { encoding: 'utf8' });
            return accountKey;
        }
    }

    async createCertificate(): Promise<void> {
        if (!this.client) {
            throw new Error('ACMEClient not initialized. Call init() before createCertificate().');
        }
        const [key, csr] = await acme.forge.createCsr({ commonName: this.domain });
        const certificate = await this.client.auto({
            csr,
            email: this.email,
            termsOfServiceAgreed: true,
            challengeCreateFn: async (authz, challenge, keyAuthorization) => {
                if (challenge.type === 'dns-01') {
                    const dnsRecordValue = keyAuthorization;
                    // eslint-disable-next-line turbo/no-undeclared-env-vars
                    const { TRANSIP_PKEY, TRANSIP_LOGIN } = process.env;
                    const dnsManager = new TransIPDNSManager(TRANSIP_PKEY || '', TRANSIP_LOGIN || '');
                    await dnsManager.authenticate();
                    await dnsManager.addDNSRecord(this.domain, {
                        name: `_acme-challenge.${this.domain}`,
                        type: 'TXT',
                        content: dnsRecordValue,
                        expire: 300
                    });
                    console.log(`DNS TXT record for ACME challenge created: ${dnsRecordValue}`);
                }
            },
            challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
                if (challenge.type === 'dns-01') {
                    // eslint-disable-next-line turbo/no-undeclared-env-vars
                    const { TRANSIP_PKEY, TRANSIP_LOGIN } = process.env;
                    const dnsManager = new TransIPDNSManager(TRANSIP_PKEY || '', TRANSIP_LOGIN || '');
                    await dnsManager.authenticate();
                    await dnsManager.removeDNSRecord(this.domain, {
                        name: `_acme-challenge.${this.domain}`,
                        type: 'TXT',
                        content: keyAuthorization,
                        expire: 300
                    });
                    console.log(`DNS TXT record for ACME challenge removed.`);
                }
            },
        });

        fs.writeFileSync(`./${this.domain}.key`, key, { encoding: 'utf8' });
        fs.writeFileSync(`./${this.domain}.crt`, certificate, { encoding: 'utf8' });
        console.log(`Certificate and key for ${this.domain} have been saved.`);
    }
}