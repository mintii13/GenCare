import { connectDatabase } from '../configs/database';
import { Blog } from '../models/Blog';
import { BlogComment } from '../models/BlogComment';

async function insertBlogData() {
    try {
        await connectDatabase();

        // Insert Blogs
        const blogsData = [
            {
                blog_id: 1,
                author_id: 15,
                title: "Hiểu biết cơ bản về sức khỏe sinh sản ở phụ nữ",
                content: "Sức khỏe sinh sản là một phần quan trọng trong cuộc sống của mỗi phụ nữ. Việc hiểu rõ về chu kỳ kinh nguyệt, các dấu hiệu bất thường và cách chăm sóc bản thân sẽ giúp phụ nữ duy trì sức khỏe tốt nhất. Trong bài viết này, chúng ta sẽ cùng tìm hiểu về những kiến thức cơ bản mà mọi phụ nữ nên biết để chăm sóc sức khỏe sinh sản của mình một cách hiệu quả nhất.",
                publish_date: new Date("2024-12-01T08:30:00.000Z"),
                updated_date: new Date("2024-12-02T10:15:00.000Z"),
                status: "published"
            },
            {
                blog_id: 2,
                author_id: 18,
                title: "Phòng tránh các bệnh lây truyền qua đường tình dục (STIs)",
                content: "Các bệnh lây truyền qua đường tình dục (STIs) là mối quan tâm hàng đầu về sức khỏe sinh sản. Bài viết này sẽ cung cấp thông tin chi tiết về các biện pháp phòng tránh hiệu quả, các triệu chứng cần lưu ý và cách xử lý khi có nghi ngờ nhiễm bệnh. Hiểu biết đúng đắn về STIs sẽ giúp bạn bảo vệ bản thân và người thân một cách tốt nhất.",
                publish_date: new Date("2024-11-28T14:20:00.000Z"),
                updated_date: new Date("2024-11-28T14:20:00.000Z"),
                status: "published"
            },
            {
                blog_id: 3,
                author_id: 15,
                title: "Hướng dẫn theo dõi chu kỳ kinh nguyệt hiệu quả",
                content: "Theo dõi chu kỳ kinh nguyệt không chỉ giúp phụ nữ hiểu rõ hơn về cơ thể mình mà còn hỗ trợ trong việc kế hoạch hóa gia đình và phát hiện sớm các bất thường. Bài viết sẽ hướng dẫn chi tiết cách theo dõi, ghi chép và phân tích chu kỳ kinh nguyệt để có được thông tin chính xác nhất về sức khỏe sinh sản.",
                publish_date: new Date("2024-11-25T09:45:00.000Z"),
                updated_date: new Date("2024-11-26T16:30:00.000Z"),
                status: "published"
            }
        ];

        await Blog.deleteMany({});
        await Blog.insertMany(blogsData);
        console.log('Blogs inserted successfully');

        // Insert Blog Comments
        const commentsData = [
            {
                comment_id: 101,
                blog_id: 1,
                customer_id: 25,
                content: "Bài viết rất hữu ích! Tôi đã hiểu rõ hơn về chu kỳ kinh nguyệt của mình. Cảm ơn bác sĩ đã chia sẻ những thông tin quý báu này.",
                comment_date: new Date("2024-12-02T15:30:00.000Z"),
                parent_comment_id: null,
                status: "approved",
                is_anonymous: false
            },
            {
                comment_id: 102,
                blog_id: 1,
                customer_id: 26,
                content: "Mình cũng đồng ý với chị ở trên. Thông tin trong bài rất dễ hiểu và thực tế.",
                comment_date: new Date("2024-12-02T16:45:00.000Z"),
                parent_comment_id: 101,
                status: "approved",
                is_anonymous: false
            },
            {
                comment_id: 103,
                blog_id: 1,
                customer_id: null,
                content: "Tôi muốn hỏi thêm về việc chu kỳ kinh nguyệt không đều thì có cần lo lắng không ạ?",
                comment_date: new Date("2024-12-03T09:20:00.000Z"),
                parent_comment_id: null,
                status: "approved",
                is_anonymous: true
            },
            {
                comment_id: 104,
                blog_id: 1,
                customer_id: 25,
                content: "Cảm ơn bác sĩ! Bài viết giúp tôi nhận ra tầm quan trọng của việc theo dõi sức khỏe sinh sản.",
                comment_date: new Date("2024-12-04T11:15:00.000Z"),
                parent_comment_id: null,
                status: "approved",
                is_anonymous: false
            },
            {
                comment_id: 105,
                blog_id: 2,
                customer_id: 26,
                content: "Thông tin về phòng tránh STIs rất cần thiết. Mong có thêm nhiều bài viết như thế này.",
                comment_date: new Date("2024-11-29T10:20:00.000Z"),
                parent_comment_id: null,
                status: "approved",
                is_anonymous: false
            }
        ];

        await BlogComment.deleteMany({});
        await BlogComment.insertMany(commentsData);
        console.log('Blog comments inserted successfully');

        console.log('All blog data inserted successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error inserting blog data:', error);
        process.exit(1);
    }
}

insertBlogData();