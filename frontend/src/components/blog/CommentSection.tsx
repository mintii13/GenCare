import React, { useState, useEffect } from 'react';
import { Comment } from '../../types/blog';
import { useAuth } from '../../contexts/AuthContext';
import { blogService } from '../../services/blogService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  MessageCircle, 
  Reply, 
  Send, 
  User, 
  UserCheck, 
  AlertCircle,
  Eye,
  EyeOff 
} from 'lucide-react';

interface CommentSectionProps {
  blogId: number;
  comments: Comment[];
  onCommentsUpdate: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  blogId,
  comments,
  onCommentsUpdate
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCustomer = user?.role === 'customer';
  const canComment = isCustomer;

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: vi 
    });
  };

  const handleSubmitComment = async (content: string, parentId?: number) => {
    if (!content.trim() || !canComment) return;

    setIsSubmitting(true);
    try {
      await blogService.createComment(blogId, content, isAnonymous, parentId);
      
      // Reset form
      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      
      onCommentsUpdate();
    } catch (error) {
      console.error('Error posting comment:', error);
      // Có thể thêm toast notification ở đây
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = (comment: Comment, level: number = 0) => {
    const isReply = level > 0;
    const marginLeft = level * 40;

    return (
      <div 
        key={comment.comment_id} 
        className={`${isReply ? 'border-l-2 border-gray-200 pl-4' : ''}`}
        style={{ marginLeft: `${marginLeft}px` }}
      >
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          {/* Header comment */}
          <div className="flex items-center mb-3">
            {comment.is_anonymous ? (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-medium text-gray-600">Người dùng ẩn danh</span>
                  <div className="flex items-center text-sm text-gray-500">
                    <EyeOff className="w-3 h-3 mr-1" />
                    <span>Bình luận ẩn danh</span>
                  </div>
                </div>
              </div>
            ) : comment.customer ? (
              <div className="flex items-center">
                <img
                  src={comment.customer.custom_avatar || comment.customer.avatar}
                  alt={comment.customer.full_name}
                  className="w-8 h-8 rounded-full object-cover mr-3"
                />
                <div>
                  <span className="font-medium text-gray-900">{comment.customer.full_name}</span>
                  <div className="flex items-center text-sm text-gray-500">
                    <UserCheck className="w-3 h-3 mr-1" />
                    <span>Khách hàng</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-400 rounded-full flex items-center justify-center mr-3">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-gray-600">Người dùng đã xóa</span>
              </div>
            )}
            
            <span className="ml-auto text-sm text-gray-500">
              {formatDate(comment.comment_date)}
            </span>
          </div>

          {/* Nội dung comment */}
          <p className="text-gray-800 mb-3 leading-relaxed">
            {comment.content}
          </p>

          {/* Actions */}
          {canComment && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setReplyingTo(comment.comment_id)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Reply className="w-4 h-4 mr-1" />
                Trả lời
              </button>
            </div>
          )}

          {/* Reply form */}
          {replyingTo === comment.comment_id && canComment && (
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Viết câu trả lời..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              <div className="flex items-center justify-between mt-3">
                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="mr-2"
                  />
                  <EyeOff className="w-4 h-4 mr-1" />
                  Trả lời ẩn danh
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleSubmitComment(replyContent, comment.comment_id)}
                    disabled={!replyContent.trim() || isSubmitting}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Đang gửi...' : 'Gửi'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Render replies */}
        {comments
          .filter(reply => reply.parent_comment_id === comment.comment_id)
          .map(reply => renderComment(reply, level + 1))
        }
      </div>
    );
  };

  // Lấy comments gốc (không phải reply)
  const rootComments = comments.filter(comment => !comment.parent_comment_id);

  return (
    <div className="mt-8">
      <div className="flex items-center mb-6">
        <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900">
          Bình luận ({comments.length})
        </h3>
      </div>

      {/* Form comment mới */}
      {canComment ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
          />
          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mr-2"
              />
              <EyeOff className="w-4 h-4 mr-1" />
              Bình luận ẩn danh
            </label>
            <button
              onClick={() => handleSubmitComment(newComment)}
              disabled={!newComment.trim() || isSubmitting}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Đang gửi...' : 'Đăng bình luận'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              {user ? (
                'Chỉ khách hàng mới có thể bình luận trên bài viết.'
              ) : (
                'Vui lòng đăng nhập với tài khoản khách hàng để bình luận.'
              )}
            </p>
          </div>
        </div>
      )}

      {/* Danh sách comments */}
      <div className="space-y-0">
        {rootComments.length > 0 ? (
          rootComments.map(comment => renderComment(comment))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection; 