import crypto from 'crypto';
import { StiOrder } from '../models/StiOrder';
import { StiOrderRepository } from '../repositories/stiOrderRepository';
export class RandomUtils{
    public static generateRandomPassword = (): string => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    public static generateRandomOTP = (startRandom: number, endRandom: number): string => {
        return crypto.randomInt(startRandom, endRandom).toString()
    }
}
