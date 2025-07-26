import React, { useState, useEffect } from 'react';
import { Comment } from '../../types/blog';
import { useAuth } from '../../contexts/AuthContext';
import { blogService } from '../../services/blogService';
import { formatDateSafe } from '../../utils/dateUtils';
import { Button, Input } from '../design-system';
import {
  MessageCircle,
  Reply,
  Send,
  User,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Heart,
  ThumbsUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';

interface CommentSectionProps {
  blogId: string;
  comments: Comment[];
  onCommentsUpdate: () => void;
  onLoginRequired: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  blogId,
  comments,
  onCommentsUpdate,
  onLoginRequired
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5); // 5 comments per page

  // Replies management state
  const [collapsedReplies, setCollapsedReplies] = useState<Set<string>>(new Set());
  const [repliesVisibleCount, setRepliesVisibleCount] = useState<Record<string, number>>({});
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [repliesPage, setRepliesPage] = useState<Record<string, number>>({});
  
  const INITIAL_REPLIES_SHOW = 2; // Hiển thị 2 replies đầu tiên

  useEffect(() => {
    setLocalComments(comments);
    // Reset về trang 1 khi có comments mới
    setCurrentPage(1);
    
    // Initialize replies visible count
    const rootComments = comments.filter(comment => !comment.parent_comment_id);
    const initialVisibleCount: Record<string, number> = {};
    const initialPages: Record<string, number> = {};
    
    rootComments.forEach(comment => {
      const replies = comments.filter(reply => reply.parent_comment_id === comment.comment_id);
      initialVisibleCount[comment.comment_id] = Math.min(INITIAL_REPLIES_SHOW, replies.length);
      initialPages[comment.comment_id] = 1;
    });
    
    setRepliesVisibleCount(initialVisibleCount);
    setRepliesPage(initialPages);
  }, [comments]);

  const canComment = !!user;

  const formatDate = formatDateSafe;

  const handleSubmitComment = async (content: string, parentId?: string) => {
    if (!content.trim()) return;
    
    if (!canComment) {
      onLoginRequired();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await blogService.createComment(blogId, content, isAnonymous, parentId);
      if ((response as any).success) {
        // Reset form
        if (parentId) {
          setReplyContent('');
          setReplyingTo(null);
        } else {
          setNewComment('');
        }
        
        // Fetch lại comments
        await onCommentsUpdate();
        toast.success('Đã đăng bình luận thành công');
      } else {
        toast.error((response as any).message || 'Không thể đăng bình luận');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Không thể đăng bình luận');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.comment_id);
    setEditContent(comment.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
    setIsEditing(false);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    setIsSubmitting(true);
    try {
      const comment = localComments.find(c => c.comment_id === commentId);
      const response = await blogService.updateComment(blogId, commentId, editContent, comment?.is_anonymous);
      if ((response as any).success) {
        setEditingCommentId(null);
        setEditContent('');
        setIsEditing(false);
        await onCommentsUpdate();
      } else {
        toast.error((response as any).message || 'Không thể cập nhật bình luận');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Không thể cập nhật bình luận');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    console.log('Attempting to delete comment:', commentId);
    setIsSubmitting(true);
    try {
      const response = await blogService.deleteComment(blogId, commentId);
      console.log('Delete comment response:', response);
      if ((response as any).success) {
        toast.success('Xóa bình luận thành công!');
        await onCommentsUpdate();
      } else {
        console.error('Delete failed:', response);
        toast.error((response as any).message || 'Xóa bình luận thất bại!');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Xóa bình luận thất bại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskDelete = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (commentToDelete) {
      await handleDeleteComment(commentToDelete);
      setShowDeleteModal(false);
      setCommentToDelete(null);
    }
  };

  // Toggle replies visibility
  const toggleRepliesVisibility = (commentId: string) => {
    setCollapsedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Load more replies using backend pagination
  const loadMoreReplies = async (parentCommentId: string) => {
    if (loadingReplies.has(parentCommentId)) return;

    setLoadingReplies(prev => new Set(prev).add(parentCommentId));
    
    try {
      const nextPage = (repliesPage[parentCommentId] || 1) + 1;
      
      // Call backend API for paginated replies
      const response = await apiClient.get(`${API.Blog.BASE}/${blogId}/comments`, {
        params: {
          parent_comment_id: parentCommentId,
          page: nextPage,
          limit: 5,
          sort_by: 'comment_date',
          sort_order: 'asc'
        }
      });

      if ((response.data as any)?.success && (response.data as any)?.data?.comments) {
        const newReplies = (response.data as any).data.comments;
        
        // Update visible count and page
        setRepliesVisibleCount(prev => ({
          ...prev,
          [parentCommentId]: (prev[parentCommentId] || INITIAL_REPLIES_SHOW) + newReplies.length
        }));
        
        setRepliesPage(prev => ({
          ...prev,
          [parentCommentId]: nextPage
        }));

        // Trigger parent update to get new comments
        await onCommentsUpdate();
      }
    } catch (error) {
      console.error('Error loading more replies:', error);
      toast.error('Không thể tải thêm phản hồi');
    } finally {
      setLoadingReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(parentCommentId);
        return newSet;
      });
    }
  };

  // Show fewer replies
  const showFewerReplies = (commentId: string) => {
    setRepliesVisibleCount(prev => ({
      ...prev,
      [commentId]: INITIAL_REPLIES_SHOW
    }));
    setRepliesPage(prev => ({
      ...prev,
      [commentId]: 1
    }));
  };

  const renderComment = (comment: Comment, level: number = 0) => {
    const isReply = level > 0;
    const marginLeft = level * 24;

    // Ẩn comment đã xóa (không user, không ẩn danh)
    if (!comment.is_anonymous && !comment.user) return null;

    // For root comments, get their replies (chỉ lấy reply chưa bị xóa)
    const replies = level === 0 
      ? localComments.filter(reply => reply.parent_comment_id === comment.comment_id && (reply.is_anonymous || reply.user))
      : [];
    
    const visibleRepliesCount = repliesVisibleCount[comment.comment_id] || INITIAL_REPLIES_SHOW;
    const visibleReplies = replies.slice(0, visibleRepliesCount);
    const hiddenRepliesCount = Math.max(0, replies.length - visibleRepliesCount);
    const isCollapsed = collapsedReplies.has(comment.comment_id);
    const isLoadingMore = loadingReplies.has(comment.comment_id);

    return (
      <div
        key={comment.comment_id}
        className={`${isReply ? 'ml-4' : ''} mb-4`}
        style={{ marginLeft: isReply ? `${marginLeft}px` : '0' }}
      >
        <div className="flex space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {comment.is_anonymous ? (
              <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center ring-2 ring-gray-200 shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
            ) : comment.user ? (
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-500 ring-2 ring-blue-100 shadow-md">
                <img
                  src={comment.user.avatar || '/default-avatar.png'}
                  alt={comment.user.full_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) {
                      target.style.display = 'none';
                      fallback.style.display = 'flex';
                    }
                  }}
                />
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold flex items-center justify-center" style={{ display: 'none' }}>
                  {comment.user.full_name?.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-red-500 rounded-2xl flex items-center justify-center ring-2 ring-red-100 shadow-md">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            {/* Comment Bubble */}
            <div className="bg-white rounded-3xl px-4 py-3 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-200 max-w-full">
              {/* User Info */}
              <div className="mb-1">
                {comment.is_anonymous ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-700">Người dùng ẩn danh</span>
                    <div className="bg-gray-100 px-2 py-1 rounded-2xl flex items-center space-x-1">
                      <EyeOff className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500 font-medium">Ẩn danh</span>
                    </div>
                  </div>
                ) : comment.user ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900">{comment.user.full_name}</span>
                    {(comment.user.role === 'consultant' || comment.user.role === 'staff' || comment.user.role === 'admin') && (
                      <div className="bg-blue-100 px-2 py-1 rounded-2xl flex items-center space-x-1">
                        <UserCheck className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-700 font-medium capitalize">{comment.user.role}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm font-bold text-gray-500">Người dùng đã xóa</span>
                )}
              </div>

              {/* Comment Content or Edit Form */}
              {editingCommentId === comment.comment_id ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => handleSaveEdit(comment.comment_id)}
                      disabled={isSubmitting || !editContent.trim()}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800 leading-relaxed break-words">{comment.content}</p>
              )}
            </div>

            {/* Actions and Time */}
            <div className="flex items-center space-x-4 mt-3 px-2">
              <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-2xl">{formatDate(comment.comment_date)}</span>
              
              {canComment && (
                <button
                  onClick={() => setReplyingTo(comment.comment_id)}
                  className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-2xl transition-all duration-200"
                >
                  <Reply className="w-3 h-3" />
                  <span>Trả lời</span>
                </button>
              )}

              {user && (
                // Chủ sở hữu bình luận có thể chỉnh sửa
                (user._id === comment.user_id || user._id === (comment.user as any)?._id)
              ) && (
                <button
                  onClick={() => handleEditComment(comment)}
                  className="flex items-center space-x-1 text-xs font-semibold text-gray-600 hover:text-gray-700 hover:bg-gray-50 px-2 py-1 rounded-2xl transition-all duration-200"
                >
                  <span>Chỉnh sửa</span>
                </button>
              )}

              {user && (
                // Chủ sở hữu bình luận (cả ẩn danh và không ẩn danh) hoặc admin/staff/consultant có thể xóa
                (user._id === comment.user_id || user._id === (comment.user as any)?._id) ||
                (user.role === 'staff' || user.role === 'consultant' || user.role === 'admin')
              ) && (
                <button
                  onClick={() => {
                    console.log('Debug Delete Permission:', {
                      user: user,
                      comment: comment,
                      user_id_check: user._id === comment.user_id,
                      user_object_check: user._id === (comment.user as any)?._id,
                      userMatch: user._id === comment.user_id || user._id === (comment.user as any)?._id,
                      roleMatch: user.role === 'staff' || user.role === 'consultant' || user.role === 'admin'
                    });
                    handleAskDelete(comment.comment_id);
                  }}
                  className="flex items-center space-x-1 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-2xl transition-all duration-200"
                >
                  <span>Xóa</span>
                </button>
              )}
            </div>

            {/* Reply Form */}
            {replyingTo === comment.comment_id && canComment && (
              <div className="mt-3 flex space-x-3">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  <img
                    src={user?.avatar || '/default-avatar.png'}
                    alt={user?.full_name || ''}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        target.style.display = 'none';
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-full bg-blue-500 text-white text-xs font-medium flex items-center justify-center" style={{ display: 'none' }}>
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-2xl flex items-center border border-gray-200 px-2">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Trả lời ${comment.is_anonymous ? 'người dùng ẩn danh' : comment.user?.full_name}...`}
                      className="w-full px-3 py-2 bg-transparent text-sm resize-none focus:outline-none placeholder-gray-500 border-0 shadow-none"
                      rows={1}
                      style={{ minHeight: '32px' }}
                      onInput={(e) => {
                        e.currentTarget.style.height = 'auto';
                        e.currentTarget.style.height = Math.max(32, e.currentTarget.scrollHeight) + 'px';
                      }}
                    />
                    <button
                      onClick={() => {
                        const parentId = level === 1 && comment.parent_comment_id 
                          ? comment.parent_comment_id 
                          : comment.comment_id;
                        handleSubmitComment(replyContent, parentId);
                      }}
                      disabled={!replyContent.trim() || isSubmitting}
                      className="ml-2 px-2 py-1 text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center justify-center rounded-full transition-colors bg-white border border-gray-200 hover:bg-gray-100"
                      style={{ minHeight: '32px' }}
                      title="Gửi"
                    >
                      {isSubmitting ? (
                        <span className="text-xs">Đang gửi...</span>
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center text-xs text-gray-500">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="mr-1 w-3 h-3"
                      />
                      <EyeOff className="w-3 h-3 mr-1" />
                      Ẩn danh
                    </label>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Replies Section for Root Comments */}
            {level === 0 && replies.length > 0 && (
              <div className="mt-3">
                {/* Toggle Replies Button */}
                <button
                  onClick={() => toggleRepliesVisibility(comment.comment_id)}
                  className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors mb-2"
                >
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Hiển thị {replies.length} phản hồi
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Ẩn phản hồi
                    </>
                  )}
                </button>

                                 {/* Replies List */}
                 {!isCollapsed && (
                   <div className="space-y-3">
                    {visibleReplies.map(reply => renderComment(reply, level + 1))}
                    
                    {/* Load More / Show Fewer Replies Controls */}
                    {replies.length > INITIAL_REPLIES_SHOW && (
                      <div className="flex items-center space-x-3 mt-3">
                        {hiddenRepliesCount > 0 && (
                          <button
                            onClick={() => loadMoreReplies(comment.comment_id)}
                            disabled={isLoadingMore}
                            className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {isLoadingMore ? (
                              <>
                                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                                Đang tải...
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                Xem thêm {hiddenRepliesCount} phản hồi
                              </>
                            )}
                          </button>
                        )}
                        
                        {visibleRepliesCount > INITIAL_REPLIES_SHOW && (
                          <button
                            onClick={() => showFewerReplies(comment.comment_id)}
                            className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <ChevronUp className="w-3 h-3 mr-1" />
                            Ẩn bớt
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Lấy comments gốc (không phải reply, không bị xóa)
  const rootComments = localComments.filter(comment => !comment.parent_comment_id && (comment.is_anonymous || comment.user));
  
  // Pagination logic
  const totalPages = Math.ceil(rootComments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedComments = rootComments.slice(startIndex, endIndex);
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">
            Bình luận
          </h3>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-2xl">
            {localComments.filter(c => (c.is_anonymous || c.user)).length}
          </span>
        </div>
      </div>

      {/* Write Comment */}
      {canComment ? (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-4 border border-blue-100 shadow-sm">
                          <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-500 ring-2 ring-blue-200 shadow-md">
                  <img
                    src={user?.avatar || '/default-avatar.png'}
                    alt={user?.full_name || ''}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        target.style.display = 'none';
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold flex items-center justify-center" style={{ display: 'none' }}>
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-lg focus-within:shadow-lg focus-within:border-blue-300">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Chia sẻ ý kiến của bạn về bài viết này..."
                    className="w-full px-4 py-3 bg-transparent text-gray-900 resize-none focus:outline-none placeholder-gray-500 rounded-2xl"
                    rows={1}
                    style={{ minHeight: '44px' }}
                    onInput={(e) => {
                      e.currentTarget.style.height = 'auto';
                      e.currentTarget.style.height = Math.max(44, e.currentTarget.scrollHeight) + 'px';
                    }}
                  />
                </div>
                {newComment.trim() && (
                  <div className="flex items-center justify-between mt-4">
                    <label className="flex items-center text-sm text-gray-600 hover:text-gray-800 cursor-pointer transition-colors bg-white px-4 py-2 rounded-2xl border border-gray-200">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500"
                      />
                      <EyeOff className="w-4 h-4 mr-2" />
                      Bình luận ẩn danh
                    </label>
                    <Button
                      onClick={() => handleSubmitComment(newComment)}
                      disabled={!newComment.trim() || isSubmitting}
                      className="px-6 py-2 text-sm rounded-2xl"
                      loading={isSubmitting}
                      leftIcon={!isSubmitting ? <Send className="w-4 h-4" /> : undefined}
                    >
                      {isSubmitting ? 'Đang đăng...' : 'Đăng bình luận'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-4 mb-6 shadow-sm">
          <div className="flex items-center">
            <div className="bg-amber-100 rounded-2xl p-3 mr-4">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-amber-800 font-bold mb-1 text-base">Yêu cầu đăng nhập</h4>
              <p className="text-amber-700 text-sm">
                {user ? (
                  'Chỉ khách hàng mới có thể bình luận trên bài viết.'
                ) : (
                  'Vui lòng đăng nhập với tài khoản khách hàng để bình luận.'
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-2">
        {rootComments.length > 0 ? (
          paginatedComments.map(comment => renderComment(comment))
        ) : (
          <div className="text-center py-20 bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-gray-100">
            <div className="bg-gray-100 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <MessageCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-3">Chưa có bình luận nào</h3>
            <p className="text-gray-500 mb-6 text-lg">Hãy là người đầu tiên chia sẻ ý kiến về bài viết này</p>
            {canComment && (
              <button
                onClick={() => document.querySelector('textarea')?.focus()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Viết bình luận đầu tiên
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {rootComments.length > pageSize && (
        <div className="flex items-center justify-center mt-16 pt-10 border-t border-gray-100">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-4 flex items-center space-x-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Trước
            </button>
            
            <div className="flex items-center space-x-2 px-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-12 h-12 text-sm font-bold rounded-2xl transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-110'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:scale-105'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-all duration-200"
            >
              Sau
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Pagination Info */}
      {rootComments.length > 0 && (
        <div className="text-center mt-10">
          <div className="inline-flex items-center bg-gray-50 px-6 py-3 rounded-3xl shadow-sm">
            <span className="text-sm text-gray-600 font-semibold">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, rootComments.length)} trong tổng số {rootComments.length} bình luận
            </span>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-200 scale-100">
            <div className="p-10">
              <div className="flex items-center mb-8">
                <div className="bg-red-100 rounded-3xl p-4 mr-6">
                  <AlertCircle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Xác nhận xóa</h3>
              </div>
              <p className="text-gray-600 mb-10 leading-relaxed text-lg">
                Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn bình luận cùng tất cả các phản hồi.
              </p>
              <div className="flex justify-end space-x-5">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="px-8 py-4 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all duration-200 hover:scale-105"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleConfirmDelete} 
                  className="px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Xóa bình luận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;