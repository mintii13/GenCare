import { BlogsResponse, CommentsResponse, Blog, Comment } from '../types/blog';

console.log('🚀 Mock data file loaded successfully');

// Mock data cho blogs
export const mockBlogsData: BlogsResponse = {
  success: true,
  message: "Lấy danh sách blog thành công",
  data: {
    blogs: [
      {
        blog_id: 1,
        author_id: 15,
        title: "Hiểu biết cơ bản về sức khỏe sinh sản ở phụ nữ",
        content: `Sức khỏe sinh sản là một phần quan trọng trong cuộc sống của mỗi phụ nữ. Việc hiểu rõ về chu kỳ kinh nguyệt, các dấu hiệu bất thường và cách chăm sóc bản thân sẽ giúp phụ nữ duy trì sức khỏe tốt nhất.

Chu kỳ kinh nguyệt bình thường:
- Thường kéo dài từ 21-35 ngày
- Kinh nguyệt kéo dài 3-7 ngày
- Lượng máu mất khoảng 30-40ml

Các dấu hiệu cần lưu ý:
- Chu kỳ kinh nguyệt không đều
- Đau bụng dưới quá mức
- Khí hư có mùi lạ hoặc màu sắc bất thường
- Ngứa hoặc nóng rát vùng kín

Cách chăm sóc hàng ngày:
1. Vệ sinh cá nhân đúng cách
2. Chế độ ăn uống cân bằng
3. Tập thể dục đều đặn
4. Giảm stress
5. Khám sức khỏe định kỳ

Hãy luôn chú ý đến cơ thể mình và tham khảo ý kiến bác sĩ khi có bất kỳ thay đổi bất thường nào.`,
        publish_date: "2024-12-01T08:30:00.000Z",
        updated_date: "2024-12-02T10:15:00.000Z",
        status: "published",
        author: {
          user_id: 15,
          full_name: "BS. Nguyễn Thị Lan",
          email: "bs.nguyenthilan@healthcenter.com",
          phone: "0901234567",
          role: "consultant",
          avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          specialization: "Sản phụ khoa",
          qualifications: "Bác sĩ chuyên khoa I Sản phụ khoa",
          experience_years: 8,
          consultation_rating: 4.8,
          total_consultations: 256
        }
      },
      {
        blog_id: 2,
        author_id: 18,
        title: "Phòng tránh các bệnh lây truyền qua đường tình dục (STIs)",
        content: `Các bệnh lây truyền qua đường tình dục (STIs) là mối quan tâm hàng đầu về sức khỏe sinh sản. Bài viết này sẽ cung cấp thông tin chi tiết về các biện pháp phòng tránh hiệu quả.

Các STIs phổ biến:
- HIV/AIDS
- Giang mai (Syphilis)
- Lậu (Gonorrhea)
- Chlamydia
- Herpes sinh dục
- HPV (Human Papillomavirus)

Biện pháp phòng tránh:
1. Sử dụng bao cao su đúng cách
2. Giới hạn số lượng bạn tình
3. Xét nghiệm định kỳ
4. Tiêm vắc xin phòng ngừa (HPV, Hepatitis B)
5. Tránh quan hệ tình dục khi có triệu chứng

Dấu hiệu cảnh báo:
- Đau rát khi tiểu tiện
- Tiết dịch bất thường
- Ngứa hoặc đau vùng sinh dục
- Phát ban hoặc loét
- Sốt, đau khớp

Tầm quan trọng của xét nghiệm:
- Phát hiện sớm các bệnh lý
- Điều trị kịp thời
- Bảo vệ bản thân và bạn tình
- Tránh biến chứng nguy hiểm

Hãy chủ động bảo vệ sức khỏe của mình bằng cách thực hiện các biện pháp phòng tránh và xét nghiệm định kỳ.`,
        publish_date: "2024-11-28T14:20:00.000Z",
        updated_date: "2024-11-28T14:20:00.000Z",
        status: "published",
        author: {
          user_id: 18,
          full_name: "ThS. Trần Văn Minh",
          email: "ths.tranvanminh@healthcenter.com",
          phone: "0907654321",
          role: "consultant",
          avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          specialization: "Y học dự phòng",
          qualifications: "Thạc sĩ Y học dự phòng",
          experience_years: 5,
          consultation_rating: 4.6,
          total_consultations: 189
        }
      },
      {
        blog_id: 3,
        author_id: 22,
        title: "Dinh dưỡng trong thai kỳ: Những điều cần biết",
        content: `Thai kỳ là giai đoạn đặc biệt quan trọng trong đời của người phụ nữ. Chế độ dinh dưỡng hợp lý không chỉ giúp mẹ khỏe mạnh mà còn đảm bảo sự phát triển tốt nhất cho thai nhi.

Các chất dinh dưỡng thiết yếu:
1. Axit folic: Ngăn ngừa dị tật ống thần kinh
2. Sắt: Phòng ngừa thiếu máu
3. Canxi: Phát triển xương và răng
4. Protein: Tăng trưởng tế bào
5. DHA: Phát triển não bộ

Thực phẩm nên ăn:
- Rau lá xanh đậm màu
- Trái cây tươi
- Thịt nạc, cá, trứng
- Sữa và sản phẩm từ sữa
- Ngũ cốc nguyên hạt
- Các loại đậu

Thực phẩm cần tránh:
- Rượu, bia
- Cà phê quá nhiều
- Cá nhiều thủy ngân
- Thịt sống hoặc tái
- Phô mai chưa thanh trùng

Lời khuyên hữu ích:
- Ăn nhiều bữa nhỏ trong ngày
- Uống đủ nước
- Bổ sung vitamin tổng hợp
- Tập thể dục nhẹ nhàng
- Theo dõi cân nặng

Hãy tham khảo ý kiến bác sĩ để có chế độ dinh dưỡng phù hợp nhất cho bản thân.`,
        publish_date: "2024-11-25T09:15:00.000Z",
        updated_date: "2024-11-26T11:30:00.000Z",
        status: "published",
        author: {
          user_id: 22,
          full_name: "BS. Lê Thị Hương",
          email: "bs.lethihuong@healthcenter.com",
          phone: "0912345678",
          role: "consultant",
          avatar: "https://images.unsplash.com/photo-1594824570330-17a813e6e7e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          specialization: "Sản phụ khoa",
          qualifications: "Bác sĩ chuyên khoa II Sản phụ khoa",
          experience_years: 12,
          consultation_rating: 4.9,
          total_consultations: 324
        }
      },
      {
        blog_id: 4,
        author_id: 25,
        title: "Chăm sóc sức khỏe nam giới: Những vấn đề thường gặp",
        content: `Nam giới cũng cần chú ý đặc biệt đến sức khỏe sinh sản và các vấn đề sức khỏe riêng. Việc hiểu rõ và phòng ngừa sớm sẽ giúp duy trì chất lượng cuộc sống tốt nhất.

Các vấn đề sức khỏe nam giới thường gặp:
1. Rối loạn cương dương
2. Xuất tinh sớm
3. Viêm tuyến tiền liệt
4. Vô sinh nam
5. Giảm testosterone

Dấu hiệu cần chú ý:
- Khó khăn trong sinh hoạt tình dục
- Đau rát khi tiểu tiện
- Tiểu đêm nhiều lần
- Mệt mỏi bất thường
- Giảm ham muốn tình dục

Biện pháp phòng ngừa:
1. Chế độ ăn uống lành mạnh
2. Tập thể dục đều đặn
3. Tránh căng thẳng
4. Hạn chế rượu bia, thuốc lá
5. Quan hệ tình dục an toàn

Khi nào cần đến bác sĩ:
- Có các triệu chứng bất thường
- Khó khăn trong việc có con
- Đau hoặc khó chịu kéo dài
- Thay đổi về cảm xúc, tâm lý

Xét nghiệm định kỳ:
- Xét nghiệm PSA (sau 50 tuổi)
- Xét nghiệm testosterone
- Tầm soát STIs
- Kiểm tra tổng quát

Đừng ngại tìm kiếm sự hỗ trợ y tế khi cần thiết. Sức khỏe tốt là nền tảng cho cuộc sống hạnh phúc.`,
        publish_date: "2024-11-20T16:45:00.000Z",
        updated_date: "2024-11-20T16:45:00.000Z",
        status: "published",
        author: {
          user_id: 25,
          full_name: "BS. Nguyễn Hoàng Nam",
          email: "bs.nguyenhoangnam@healthcenter.com",
          phone: "0923456789",
          role: "consultant",
          avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          specialization: "Nam khoa",
          qualifications: "Bác sĩ chuyên khoa I Nam khoa - Tiết niệu",
          experience_years: 7,
          consultation_rating: 4.7,
          total_consultations: 198
        }
      },
      {
        blog_id: 5,
        author_id: 28,
        title: "Tầm soát ung thư cổ tử cung: Tại sao quan trọng?",
        content: `Ung thư cổ tử cung là một trong những loại ung thư phổ biến ở phụ nữ, nhưng hoàn toàn có thể phòng ngừa và điều trị hiệu quả nếu phát hiện sớm.

Tại sao cần tầm soát:
- Phát hiện sớm tế bào bất thường
- Ngăn ngừa tiến triển thành ung thư
- Tỷ lệ chữa khỏi cao khi phát hiện sớm
- Chi phí điều trị thấp hơn

Phương pháp tầm soát:
1. Xét nghiệm Pap smear
2. Xét nghiệm HPV DNA
3. Soi cổ tử cung (Colposcopy)
4. Sinh thiết nếu cần thiết

Ai nên tầm soát:
- Phụ nữ từ 21 tuổi trở lên
- Đã có quan hệ tình dục
- Có nhiều bạn tình
- Nhiễm HPV
- Có tiền sử gia đình

Tần suất tầm soát:
- 21-29 tuổi: Pap smear 3 năm/lần
- 30-65 tuổi: Pap + HPV 5 năm/lần
- Sau 65 tuổi: Theo chỉ định bác sĩ

Triệu chứng cần chú ý:
- Ra máu bất thường
- Khí hư có mùi
- Đau khi quan hệ
- Đau bụng dưới

Phòng ngừa:
1. Tiêm vắc xin HPV
2. Quan hệ tình dục an toàn
3. Hạn chế thuốc lá
4. Tăng cường miễn dịch
5. Tầm soát định kỳ

Đừng để sợ hãi ngăn cản việc chăm sóc sức khỏe của mình. Tầm soát định kỳ là cách tốt nhất để bảo vệ bản thân.`,
        publish_date: "2024-11-15T11:20:00.000Z",
        updated_date: "2024-11-16T09:45:00.000Z",
        status: "published",
        author: {
          user_id: 28,
          full_name: "BS. Phạm Thị Mai",
          email: "bs.phamthimai@healthcenter.com",
          phone: "0934567890",
          role: "consultant",
          avatar: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
          specialization: "Sản phụ khoa",
          qualifications: "Bác sĩ chuyên khoa I Sản phụ khoa - Ung thư học",
          experience_years: 10,
          consultation_rating: 4.8,
          total_consultations: 287
        }
      }
    ]
  }
};

// Mock data cho comments
export const mockCommentsData: { [blogId: number]: CommentsResponse } = {
  1: {
    success: true,
    message: "Lấy danh sách comment thành công",
    data: {
      comments: [
        {
          comment_id: 101,
          blog_id: 1,
          customer_id: 25,
          content: "Bài viết rất hữu ích! Tôi đã hiểu rõ hơn về chu kỳ kinh nguyệt của mình. Cảm ơn bác sĩ đã chia sẻ những thông tin quý báu này.",
          comment_date: "2024-12-02T15:30:00.000Z",
          parent_comment_id: null,
          status: "approved",
          is_anonymous: false,
          customer: {
            user_id: 25,
            full_name: "Nguyễn Thị Hoa",
            email: "nguyenthihoa@gmail.com",
            phone: "0912345678",
            role: "customer",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
            medical_history: "Không có bệnh lý đặc biệt",
            custom_avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
            last_updated: "2024-11-15T14:20:00.000Z"
          }
        },
        {
          comment_id: 102,
          blog_id: 1,
          customer_id: 26,
          content: "Mình cũng đồng ý với chị ở trên. Thông tin trong bài rất dễ hiểu và thực tế.",
          comment_date: "2024-12-02T16:45:00.000Z",
          parent_comment_id: 101,
          status: "approved",
          is_anonymous: false,
          customer: {
            user_id: 26,
            full_name: "Lê Thị Mai",
            email: "lethimai@gmail.com",
            phone: "0918765432",
            role: "customer",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
            medical_history: "Tiền sử viêm nhiễm phụ khoa",
            custom_avatar: null,
            last_updated: "2024-12-01T09:30:00.000Z"
          }
        },
        {
          comment_id: 103,
          blog_id: 1,
          customer_id: null,
          content: "Tôi muốn hỏi thêm về việc chu kỳ kinh nguyệt không đều thì có cần lo lắng không ạ?",
          comment_date: "2024-12-03T09:20:00.000Z",
          parent_comment_id: null,
          status: "approved",
          is_anonymous: true,
          customer: null
        },
        {
          comment_id: 104,
          blog_id: 1,
          customer_id: 27,
          content: "Cảm ơn bác sĩ! Mình sẽ chú ý hơn đến các dấu hiệu bất thường.",
          comment_date: "2024-12-03T10:15:00.000Z",
          parent_comment_id: null,
          status: "approved",
          is_anonymous: false,
          customer: {
            user_id: 27,
            full_name: "Trần Thị Lan",
            email: "tranthilan@gmail.com",
            phone: "0987654321",
            role: "customer",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
            medical_history: "Không có tiền sử bệnh lý",
            custom_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
            last_updated: "2024-11-20T16:45:00.000Z"
          }
        }
      ]
    },
    timestamp: "2024-12-15T10:35:00.000Z"
  },
  2: {
    success: true,
    message: "Lấy danh sách comment thành công",
    data: {
      comments: [
        {
          comment_id: 201,
          blog_id: 2,
          customer_id: 28,
          content: "Bài viết rất quan trọng! Mọi người cần có kiến thức về STIs để tự bảo vệ mình.",
          comment_date: "2024-11-29T08:30:00.000Z",
          parent_comment_id: null,
          status: "approved",
          is_anonymous: false,
          customer: {
            user_id: 28,
            full_name: "Hoàng Văn Dũng",
            email: "hoangvandung@gmail.com",
            phone: "0909123456",
            role: "customer",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
            medical_history: "Không có bệnh lý đặc biệt",
            custom_avatar: null,
            last_updated: "2024-11-10T12:00:00.000Z"
          }
        },
        {
          comment_id: 202,
          blog_id: 2,
          customer_id: null,
          content: "Tôi muốn hỏi về việc xét nghiệm STIs nên làm ở đâu và có đau không ạ?",
          comment_date: "2024-11-29T14:20:00.000Z",
          parent_comment_id: null,
          status: "approved",
          is_anonymous: true,
          customer: null
        }
      ]
    },
    timestamp: "2024-12-15T10:35:00.000Z"
  }
};

// Mock data cho specializations
export const mockSpecializationsData = {
  success: true,
  message: "Lấy danh sách chuyên khoa thành công",
  data: {
    specializations: [
      "Sản phụ khoa",
      "Y học dự phòng", 
      "Nam khoa",
      "Nhi khoa",
      "Tim mạch",
      "Thần kinh",
      "Da liễu",
      "Tiết niệu",
      "Nội tiết",
      "Ung thư học"
    ]
  }
};

// Helper function để lấy blog theo ID
export const getBlogById = (id: number): Blog | undefined => {
  return mockBlogsData.data.blogs.find(blog => blog.blog_id === id);
};

// Helper function để lấy comments theo blog ID  
export const getCommentsByBlogId = (blogId: number): Comment[] => {
  return mockCommentsData[blogId]?.data.comments || [];
}; 