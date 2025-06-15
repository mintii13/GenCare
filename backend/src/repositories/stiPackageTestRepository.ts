import { StiPackageTest, IStiPackageTest } from '../models/StiPackageTest';

export class StiPackageTestRepository{
    public static async getPackageTest(sti_package_id: string): Promise<IStiPackageTest[] | null> {
        return await StiPackageTest.find({
                sti_package_id,
                is_active: true
            }).lean<IStiPackageTest[]>(sti_package_id);
    }

    public static async insertManyPackageTests(stiPackageTests: {sti_package_id: string; sti_test_id: string;is_active: boolean;}[]): Promise<void> {
        try {
            await StiPackageTest.create(stiPackageTests);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async deletePackageTestsByPackageId(sti_package_id: string): Promise<void> {
        try {
            await StiPackageTest.deleteMany({ sti_package_id });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}