export interface PackageInfo {
    name: string;
    code: string;
    price: number;
    tests: string[];
    description: string;
}

export class StiPackageHelper {
    private static packages: Record<string, PackageInfo> = {
        'STI-BASIC-01': {
            name: 'Gói xét nghiệm STIs CƠ BẢN 1',
            code: 'STI-BASIC-01',
            price: 7000000,
            tests: ['HIV combo Alere', 'Giang mai', 'Lậu', 'Chlamydia'],
            description: 'Gói test nhanh HIV combo Alere, test nhanh Giang mai, Lậu, Chlamydia'
        },
        'STI-BASIC-02': {
            name: 'Gói xét nghiệm STIs CƠ BẢN 2',
            code: 'STI-BASIC-02',
            price: 9000000,
            tests: ['HIV combo Alere', 'Giang mai', 'Viêm gan B', 'Viêm gan C', 'Lậu', 'Chlamydia'],
            description: 'Gói test nhanh HIV combo Alere, test nhanh Giang mai, test nhanh Viêm gan B, test nhanh Viêm gan C, Lậu, Chlamydia'
        },
        'STI-ADVANCE': {
            name: 'Gói xét nghiệm STIs NÂNG CAO',
            code: 'STI-ADVANCE',
            price: 17000000,
            tests: ['HIV combo Alere', 'Viêm gan B', 'Viêm gan C', 'Herpes', 'RPR', 'Syphilis TP IgM/IgG', 'Lậu', 'Chlamydia'],
            description: 'Gói test nhanh HIV combo Alere, test nhanh Viêm gan B, test nhanh Viêm gan C, Herpes, RPR, Syphilis TP IgM/IgG, Lậu, Chlamydia - Gói toàn diện với hầu hết các STIs có thể xét nghiệm được và bằng phương pháp kỹ thuật cao'
        }
    };

    public static getPackageInfo(packageCode: string): PackageInfo | null {
        return this.packages[packageCode] || null;
    }

    public static getAllPackages(): PackageInfo[] {
        return Object.values(this.packages);
    }

    public static validatePackageCode(packageCode: string): boolean {
        return packageCode in this.packages;
    }
}