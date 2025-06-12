import { StiPackageTest, IStiPackageTest } from '../models/StiPackageTest';

export class StiPackageTestRepository{
    public static async getPackageTest(sti_package_id: string): Promise<IStiPackageTest[] | null> {
        return await StiPackageTest.find({
                sti_package_id,
                is_active: true
            }).lean<IStiPackageTest[]>(sti_package_id);
    }
}