import crypto from 'crypto';

export class RandomUtils {
    public static generateRandomOTP = (startRandom: number, endRandom: number): string => {
        return crypto.randomInt(startRandom, endRandom).toString();
    };

    /**
     * Generate random string for Google Meet ID format
     * @param length Length of string to generate
     * @param includeNumbers Whether to include numbers (default: false for Meet ID)
     */
    public static generateRandomString = (length: number, includeNumbers: boolean = false): string => {
        const chars = includeNumbers
            ? 'abcdefghijklmnopqrstuvwxyz0123456789'
            : 'abcdefghijklmnopqrstuvwxyz';

        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    /**
     * Generate meeting password (6 digits)
     */
    public static generateMeetingPassword = (): string => {
        return crypto.randomInt(100000, 999999).toString();
    };

    /**
     * Generate secure random token
     */
    public static generateSecureToken = (length: number = 32): string => {
        return crypto.randomBytes(length).toString('hex');
    };

    /**
     * Generate UUID-like string
     */
    public static generateUUID = (): string => {
        return crypto.randomUUID();
    };
}