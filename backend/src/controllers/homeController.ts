import { Request, Response } from 'express';
import { Router } from 'express';
import { StiService } from '../services/stiService';
import { BlogService } from '../services/blogService';
import { ConsultantService } from '../services/consultantService';

const router = Router();

export class HomeController {
  /**
   * Get all homepage data in a single API call
   * Combines STI tests, packages, blogs, and consultants
   */
  async getHomepageData(req: Request, res: Response): Promise<void> {
    try {
      
      
      // Fetch all data in parallel
      const [stiTestsResponse, stiPackagesResponse, blogsResponse, consultantsResponse] = await Promise.all([
        StiService.getAllStiTest(),
        StiService.getAllStiPackage(),
        BlogService.getBlogsWithPagination({
          limit: 6,
          status: true,
          sort_by: 'publish_date',
          sort_order: 'desc'
        }),
        ConsultantService.getAllConsultants(1, 10)
      ]);

      // Extract data arrays from responses
      const stiTests = (stiTestsResponse as any).stitest || (stiTestsResponse as any).tests || [];
      const stiPackages = (stiPackagesResponse as any).stipackage || (stiPackagesResponse as any).packages || [];
      const blogs = blogsResponse.success ? blogsResponse.data.blogs : [];
      
      // Debug consultant response
      console.log('🔍 HomeController: consultantsResponse:', JSON.stringify(consultantsResponse, null, 2));
      const consultants = (consultantsResponse as any).success ? (consultantsResponse as any).data.consultants : [];
      console.log('🔍 HomeController: extracted consultants:', consultants.length);

      // Filter active items
      const activeStiTests = stiTests.filter((test: any) => test.is_active !== false);
      const activeStiPackages = stiPackages.filter((pkg: any) => pkg.is_active !== false);
      const activeBlogs = blogs.filter((blog: any) => blog.status === true);
      const topConsultants = consultants.slice(0, 3);

      const responseData = {
        success: true,
        data: {
          sti_tests: activeStiTests,
          sti_packages: activeStiPackages,
          blogs: activeBlogs,
          consultants: topConsultants,
          stats: {
            total_tests: activeStiTests.length,
            total_packages: activeStiPackages.length,
            total_blogs: activeBlogs.length,
            total_consultants: topConsultants.length
          }
        },
        message: 'Homepage data fetched successfully'
      };

      res.status(200).json(responseData);
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch homepage data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

const homeController = new HomeController();

// Routes
router.get('/data', homeController.getHomepageData.bind(homeController));

export default router; 