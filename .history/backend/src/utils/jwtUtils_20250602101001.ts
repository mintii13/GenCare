import jwt from 'jsonwebtoken';

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

export class JWTUtils {
    private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    private static readonly JWT_EXPIRES_IN = '1d'; // 1 ngày

    /**
     * Tạo access token
     */
    public static generateAccessToken(payload: JWTPayload): string {
        return jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN,
            algorithm: 'HS256'
        });
    }

    /**
     * Verify và decode token
     */
    public static verifyToken(token: string): JWTPayload | null {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
            return decoded;
        } catch (error) {
            console.error('JWT verification error:', error);
            return null;
        }
    }

    /**
     * Decode token không verify (để lấy thông tin khi token expired)
     */
    public static decodeToken(token: string): JWTPayload | null {
        try {
            const decoded = jwt.decode(token) as JWTPayload;
            return decoded;
        } catch (error) {
            console.error('JWT decode error:', error);
            return null;
        }
    }
}