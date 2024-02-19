import * as acme from 'acme-client';
import * as fs from 'fs';

class ACMEClient {
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
            return fs.readFileSync(keyPath, 'utf8');
        } catch (e) {
            const accountKey = await acme.forge.createPrivateKey();
            fs.writeFileSync(keyPath, accountKey, 'utf8');
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
                console.log(`Handle challenge for ${authz.identifier.value}:`, challenge);
            },
            challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
                console.log(`Clean up challenge for ${authz.identifier.value}:`, challenge);
            },
        });

        fs.writeFileSync(`./${this.domain}.key`, key, 'utf8');
        fs.writeFileSync(`./${this.domain}.crt`, certificate, 'utf8');
        console.log(`Certificate and key for ${this.domain} have been saved.`);
    }
}