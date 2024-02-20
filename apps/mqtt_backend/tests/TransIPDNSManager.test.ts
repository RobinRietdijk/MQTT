import { describe, beforeEach, beforeAll, afterAll, it, expect, jest } from '@jest/globals'
import { TransIPDNSManager, calculateExpiryDate } from '../TransIPDNSManager';
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('axios');
jest.mock('crypto', () => ({
    createSign: () => ({
        update: () => { },
        sign: () => 'mock_signature'
    }),
    randomBytes: () => Buffer.from('mock_nonce')
}));

const mockPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/aOyGfX4ylmDK
XmhS9lb9HY0lUcfesxL9e3fF02iOhP7gVLDPG+YeQPY5cUIvi31NNqUVQ09dAz0i
VXJSnSEF/zB7PgbDA7hqRK2pSI9FxFy/aX2Rb5ULZPiloxyhhWDDc1n3C4UEpQJI
erseKK1qmWeky+dR4qknTyomkPVYavpONZQRhuIHaLrR/Iqi+Torp0rKHQYYOm5z
oN4aLg66bhToFwUT99WG8eobHcMEpBb4GXzIasTBKwlhuxF0nyucZIJ5B+sOEahB
NW9uRBhLNwRGqGYNcxXhwoqK05KLQ1uY54t5XP/Fz1YcoyvzWlprEJ9qFEKzHBx9
CwBES6BTAgMBAAECggEADK6wuqSGqma+WQpHp/TnL0mNou237DCPTzj8EaEqqgQe
jdHuuST5wALBOG3MWzFx3EjaR/4NZyCiJKvmsZn0UzJlDaAUJfMRfVu5lKAt0LXs
XfO+ZywugvJuFdjTOnyHkcu10qGdGawD6mDUvxsmNQxJtWib621flIQxSxw1tWWb
0+FdtrUwRFmiwWxCJtrJmtAq2PFJ+g5zvxneFK16aiI4od5+BufCEVzx08IMuFl2
VETd5wPPV8BQymJrBJABdgiJArwbHorYbmmZ+9FBTdkLt77YKIg4am0LUKhy06E8
XE2YORYwgN5LiaYXgK0qwwh42J6JwXdpkFQ7QNQfIQKBgQDmZeeaICzZ6rsLdxKl
i5garApg3x/+KmWO5MP8KAUJipjZsC4ggNksiFzdqGNzNzzuq8HSG/aDVa4PQeBW
EUyb/oCeCyITDp8dRxNkz744BjKywguTTp4o+f3gFxc7PqvPWVgGggKkDyilrI6e
ASXbWIOWUrThYEQqq1tuOkRYkQKBgQDUre2hHRoHPDmO3iU/cTW+qOoGzJRaK3j+
mC5Es6zCKKl2KuSidpk1W6GdRwy9v6LboklZrVr7d37pBpH/bC8WsuXa19UH2a3p
Xh4qm1hRFS8lHjH2zap7M/gg8tDyTjgo+foyLHJWbH+PDaDlgdZwKjKRMTEPJAsd
hQSMalF8owKBgQCyMTiKFL57oDcf6+0JCkkOv+aa+5bj3eiENtx5Zn5W3dHP85oJ
W34cGi8w5C5eiudedIrINQZYl2iytjGKf4Cv2YuiMFwfPxzC6RjPzHiDHhAR/1Ay
kwhyCr9WlKVMFfGNwbz5842VU4ANesMm4x5jYjcLiVYKRYkTM0rYmsoHcQKBgCWd
aWTQZ9UVwrxQ79eLp0zERTfUoPxdqfWlZrGB8bEZTfd3WJ6fSTOVtDzD3y4EIcKk
rkJtFaVaGhkOr220bZOfKmYNPEE6L7cRjVZNyU316DOxZnbXIyrNIzp4l5nzWZ1t
sOGE2OgOInVjnKxazVljLTReteWOo2SiLQ7EkwrvAoGAGMZfW1qtdI7hRddwAcTP
wd26e5wJB6VfJtfeQ5AZYjJ3pNxVX9dJg87+CCWobnwYlbScfRNoo0Ra9ldZyMUQ
J+Xgt7HUm+0aqPmiMPRY1SPjo9EZrbzqXVWhm7Wf5ji3jikLJiNenOamPGJngGgh
PLHifaU4aYtACRqVuDI8ctg=
-----END PRIVATE KEY-----`;


describe('TransIPDNSManager', () => {
    let dnsManager: TransIPDNSManager;

    beforeEach(() => {
        dnsManager = new TransIPDNSManager(mockPrivateKey, 'login');
        jest.clearAllMocks();
    });

    describe('TransIPDNSManager - calculateExpiryData', () => {
        const mockNow = 1609459200000;
        beforeAll(() => {
            jest.spyOn(Date, 'now').mockImplementation(() => mockNow);
        });

        afterAll(() => {
            jest.restoreAllMocks();
        });

        it('calculates expiry correctly for seconds', () => {
            const result = calculateExpiryDate('10 seconds');
            expect(result).toBe(mockNow + 10000);
        });

        it('calculates expiry correctly for minutes', () => {
            const result = calculateExpiryDate('1 minute');
            expect(result).toBe(mockNow + 60000);
        });

        it('calculates expiry correctly for hours', () => {
            const result = calculateExpiryDate('1 hour');
            expect(result).toBe(mockNow + 3600000);
        });

        it('calculates expiry correctly for days', () => {
            const result = calculateExpiryDate('1 day');
            expect(result).toBe(mockNow + 86400000);
        });

        it('calculates expiry correctly for weeks', () => {
            const result = calculateExpiryDate('1 week');
            expect(result).toBe(mockNow + 604800000);
        });

        it('throws an error for unsupported expiration format', () => {
            expect(() => {
                calculateExpiryDate('1 fortnight');
            }).toThrow('Unsupported expiration format');
        });

        it('throws an error for malformed expiration format', () => {
            expect(() => {
                calculateExpiryDate('abc');
            }).toThrow('Unsupported expiration format');
        });
    });

    describe('TransIPDNSManager - isAuthenticated', () => {
        it('checks authentication correctly when not authenticated', () => {
            expect(dnsManager.isAuthenticated()).toBeFalsy();
        });

        it('checks authentication correctly when authenticated', () => {
            dnsManager['accessToken'] = "mock access token";
            dnsManager['tokenExpiry'] = Date.now() + 1000;
            expect(dnsManager.isAuthenticated()).toBeTruthy();
        });

        it('checks authentication correctly when expired', () => {
            dnsManager['accessToken'] = "mock access token";
            dnsManager['tokenExpiry'] = Date.now() - 1000;
            expect(dnsManager.isAuthenticated()).toBeFalsy();
        });
    })

    describe('TransIPDNSManager - authenticate', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            mockedAxios.post.mockClear();
        });

        it('successfully authenticates with default parameters', async () => {
            const instance = new TransIPDNSManager('login', 'privateKey');
            mockedAxios.post.mockResolvedValue({ data: { accessToken: 'test_token' } });

            await instance.authenticate();

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.transip.nl/v6/auth',
                expect.any(String),
                {
                    headers: {
                        'Signature': 'mock_signature',
                        'Content-Type': 'application/json'
                    }
                }
            );
            expect(instance['accessToken']).toBe('test_token');
        });

        it('successfully authenticates with custom parameters', async () => {
            const instance = new TransIPDNSManager('login', 'privateKey');
            mockedAxios.post.mockResolvedValue({ data: { accessToken: 'custom_token' } });

            await instance.authenticate(true, '1 hour', 'custom_label', false);

            expect(mockedAxios.post).toHaveBeenCalled();
            const postCallArgs = mockedAxios.post.mock.calls[0] ?? [];
            const requestBodyStr = typeof postCallArgs[1] === 'string' ? postCallArgs[1] : '{}';
            const requestBody = JSON.parse(requestBodyStr);

            expect(requestBody.read_only).toBe(true);
            expect(requestBody.expiration_time).toBe('1 hour');
            expect(requestBody.label).toBe('custom_label');
            expect(requestBody.global_key).toBe(false);

            expect(instance['accessToken']).toBe('custom_token');
        });

        it('handles authentication failure', async () => {
            const instance = new TransIPDNSManager('login', 'privateKey');
            mockedAxios.post.mockRejectedValue(new Error('Auth failed'));

            await expect(instance.authenticate()).rejects.toThrow('Auth failed');
        });
    });

    describe('TransIPDNSManager - addDNSRecord', () => {
        it('successfully adds a DNS record', async () => {
            mockedAxios.post.mockResolvedValue({ data: 'DNS TXT Record added successfully' });
            Object.defineProperty(dnsManager, 'isAuthenticated', {
                get: jest.fn().mockReturnValue(true)
            });
            dnsManager['accessToken'] = 'mock_access_token';

            await dnsManager.addDNSRecord('example.com', { name: 'test', type: 'TXT', content: 'test_content', expire: 300 });

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.transip.nl/v6/domains/example.com/dns',
                { dnsEntry: { name: 'test', type: 'TXT', content: 'test_content', expire: 300 } },
                {
                    headers: {
                        'Authorization': 'Bearer mock_access_token',
                        'Content-Type': 'application/json'
                    }
                }
            );
        });

        it('throws an error when not authenticated', async () => {
            Object.defineProperty(dnsManager, 'isAuthenticated', {
                get: jest.fn().mockReturnValue(false)
            });

            await expect(dnsManager.addDNSRecord('example.com', { name: 'test', type: 'TXT', content: 'test_content', expire: 300 }))
                .rejects.toThrow('Not authenticated: Call authenticate() before adding DNS records.');
        });

        it('handles failure from axios when adding a DNS record', async () => {
            mockedAxios.post.mockRejectedValue(new Error('Failed to add DNS TXT Record'));
            Object.defineProperty(dnsManager, 'isAuthenticated', {
                get: jest.fn().mockReturnValue(true)
            });
            dnsManager['accessToken'] = 'mock_access_token';

            await expect(dnsManager.addDNSRecord('example.com', { name: 'test', type: 'TXT', content: 'test_content', expire: 300 }))
                .rejects.toThrow('Failed to add DNS TXT Record');
        });
    });

    describe('TransIPDNSManager - removeDNSRecord', () => {
        it('successfully removes a DNS record', async () => {
            mockedAxios.mockResolvedValue({ data: 'DNS TXT Record removed successfully' });
            Object.defineProperty(dnsManager, 'isAuthenticated', {
                get: jest.fn().mockReturnValue(true)
            });
            dnsManager['accessToken'] = 'mock_access_token';

            await dnsManager.removeDNSRecord('example.com', { name: 'test', type: 'TXT', content: 'test_content', expire: 300 });

            expect(mockedAxios).toHaveBeenCalledWith({
                method: 'delete',
                url: 'https://api.transip.nl/v6/domains/example.com/dns',
                headers: {
                    'Authorization': 'Bearer mock_access_token',
                    'Content-Type': 'application/json'
                },
                data: { dnsEntry: { name: 'test', type: 'TXT', content: 'test_content', expire: 300 } }
            });
        });

        it('throws an error when not authenticated', async () => {
            Object.defineProperty(dnsManager, 'isAuthenticated', {
                get: jest.fn().mockReturnValue(false)
            });

            await expect(dnsManager.removeDNSRecord('example.com', { name: 'test', type: 'TXT', content: 'test_content', expire: 300 }))
                .rejects.toThrow('Not authenticated: Call authenticate() before adding DNS records.');
        });

        it('handles failure from axios when removing a DNS record', async () => {
            mockedAxios.mockRejectedValue(new Error('Failed to remove DNS TXT Record'));
            Object.defineProperty(dnsManager, 'isAuthenticated', {
                get: jest.fn().mockReturnValue(true)
            });
            dnsManager['accessToken'] = 'mock_access_token';

            await expect(dnsManager.removeDNSRecord('example.com', { name: 'test', type: 'TXT', content: 'test_content', expire: 300 }))
                .rejects.toThrow('Failed to remove DNS TXT Record');
        });
    });
});