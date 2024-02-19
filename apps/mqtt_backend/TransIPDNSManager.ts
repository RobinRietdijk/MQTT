import axios from 'axios';
import * as crypto from 'crypto';

type DNSRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT' | 'SRV' | 'SSHFP' | 'TLSA' | 'CAA' | 'NAPTR';
export interface DNSEntry {
    name: string,
    expire: number,
    type: DNSRecordType,
    content: string
}

export function calculateExpiryDate(expiration: string): number {
    const matches = expiration.match(/\d+/);
    if (!matches) {
        console.error('Unsupported expiration format');
        throw new Error('Unsupported expiration format');
    }
    const duration = parseInt(matches[0], 10);
    let milliseconds = 0;
    if (expiration.includes('second')) {
        milliseconds = duration * 1000;
    } else if (expiration.includes('minute')) {
        milliseconds = duration * 60 * 1000;
    } else if (expiration.includes('hour')) {
        milliseconds = duration * 60 * 60 * 1000;
    } else if (expiration.includes('day')) {
        milliseconds = duration * 24 * 60 * 60 * 1000;
    } else if (expiration.includes('week')) {
        milliseconds = duration * 7 * 24 * 60 * 60 * 1000;
    } else {
        console.error('Unsupported expiration format');
        throw new Error('Unsupported expiration format');
    }
    return Date.now() + milliseconds;
}

export class TransIPDNSManager {
    private accessToken: string | null = null;
    private tokenExpiry: number | null = null;

    constructor(private pkey: string, private login: string) { }

    public isAuthenticated(): boolean {
        return this.accessToken !== null && this.tokenExpiry !== null && Date.now() < this.tokenExpiry;
    }

    public async authenticate(read_only: boolean = false, expiration: string = '30 minutes', label: string = "mqtt_broker", global_key: boolean = true): Promise<void> {
        const nonce = crypto.randomBytes(16).toString('hex');
        const requestBody = {
            login: this.login,
            nonce: nonce,
            read_only: read_only,
            expiration_time: expiration,
            label: label,
            global_key: global_key
        };

        const jsonRequestBody = JSON.stringify(requestBody);
        const signer = crypto.createSign('RSA-SHA512');
        signer.update(jsonRequestBody);
        const signature = signer.sign(this.pkey, 'base64');

        try {
            const res = await axios.post('https://api.transip.nl/v6/auth', jsonRequestBody, {
                headers: {
                    'Signature': signature,
                    'Content-Type': 'application/json'
                }
            });

            this.accessToken = res.data.accessToken;
            this.tokenExpiry = calculateExpiryDate(expiration);
        } catch (error) {
            console.error('Error during authentication:', error);
            throw error;
        }
    }

    public async addDNSRecord(domainName: string, dnsEntry: DNSEntry) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated: Call authenticate() before adding DNS records.');
        }

        const url = `https://api.transip.nl/v6/domains/${domainName}/dns`;
        try {
            const res = await axios.post(url, { dnsEntry: dnsEntry }, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('DNS TXT Record added successfully:', res.data);
        } catch (error) {
            console.error('Failed to add DNS TXT Record:', error);
            throw error;
        }
    }

    public async removeDNSRecord(domainName: string, dnsEntry: DNSEntry) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated: Call authenticate() before adding DNS records.');
        }

        const url = `https://api.transip.nl/v6/domains/${domainName}/dns`;
        try {
            const res = await axios({
                method: 'delete',
                url: url,
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                data: { dnsEntry: dnsEntry }
            });
            console.log('DNS TXT Record removed successfully:', res.data);
        } catch (error) {
            console.error('Failed to remove DNS TXT Record:', error);
            throw error;
        }
    }
}