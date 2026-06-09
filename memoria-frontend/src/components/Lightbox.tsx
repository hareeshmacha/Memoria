import React, { useEffect, useState } from 'react';
import { X, Trash2, Tag, Calendar, User, Users, Loader2, Heart, ThumbsUp, Share2, Download, MessageSquare, Send, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { endpoints } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface LightboxProps {
  media: any;
  onClose: () => void;
  onDeleteSuccess?: () => void;
}

export function Lightbox({ media, onClose, onDeleteSuccess }: LightboxProps) {
  const { currentUser } = useAuthStore();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // Interactions state
  const [isFavourited, setIsFavourited] = useState(media?.is_favourited || false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);
  
  const [isLiked, setIsLiked] = useState(media?.isLiked || false);
  const [likeCount, setLikeCount] = useState(media?.like_count || 0);
  const [likeLoading, setLikeLoading] = useState(false);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Tags state
  const [tags, setTags] = useState<any[]>(media?.tags_in_media || []);
  const [isTagging, setIsTagging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [media.id]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const delayDebounceFn = setTimeout(async () => {
        setSearchLoading(true);
        try {
          const res = await endpoints.users.searchUsers(searchQuery);
          setSearchResults(res.data.data);
        } catch (err) {
          console.error(err);
        } finally {
          setSearchLoading(false);
        }
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchComments = async () => {
    try {
      const res = await endpoints.media.getComments(media.id);
      setComments(res.data.data);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!media) return null;

  const url = media.signed_url || `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'hareesh-project-uploads'}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1'}.amazonaws.com/${media.s3_key}`;

  const isUploader = currentUser?.id === media.uploaded_by;

  const handleToggleFavourite = async () => {
    setFavouriteLoading(true);
    try {
      const res = await endpoints.media.toggleFavourite(media.id);
      setIsFavourited(res.data.data.isFavourited);
    } catch (err) {
      console.error('Failed to toggle favourite', err);
    } finally {
      setFavouriteLoading(false);
    }
  };

  const handleToggleLike = async () => {
    setLikeLoading(true);
    try {
      const res = await endpoints.media.toggleLike(media.id);
      const newIsLiked = res.data.data.isLiked;
      setIsLiked(newIsLiked);
      setLikeCount((prev: number) => newIsLiked ? prev + 1 : Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to toggle like', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Page link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = async () => {
    try {
      const token = useAuthStore.getState().accessToken;
      const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/media/${media.id}/download/watermark`;
      
      const response = await fetch(downloadUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (!response.ok) throw new Error('Download failed on server');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const disposition = response.headers.get('Content-Disposition');
      let filename = media.original_filename || 'download';
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download image.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await endpoints.media.addComment(media.id, newComment);
      setComments([res.data.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await endpoints.media.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const handleAddTag = async (userId: string) => {
    try {
      const res = await endpoints.media.addTag(media.id, userId);
      setTags([...tags, res.data.data]);
      setIsTagging(false);
      setSearchQuery('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to tag user');
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!confirm('Remove tag?')) return;
    try {
      await endpoints.media.removeTag(tagId);
      setTags(tags.filter(t => t.id !== tagId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove tag');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this photo? This cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await endpoints.media.delete(media.id);
      if (onDeleteSuccess) onDeleteSuccess();
      onClose();
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Failed to delete photo');
      setDeleteLoading(false);
    }
  };

  // Combine AI faces and Manual Tags for UI
  const allTaggedUsers = [
    ...(media.media_faces?.map((mf: any) => ({ ...mf.user, isAi: true, tagId: null })) || []),
    ...tags.map((t: any) => ({ ...t.tagged_user, isAi: false, tagId: t.id, taggedBy: t.tagged_by }))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex flex-col lg:flex-row w-full h-full p-4 lg:p-12 gap-8 items-center justify-center">
        {/* Main Image/Video Area */}
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center relative">
          {media.file_type === 'video' ? (
            <video 
              src={url} 
              controls
              autoPlay
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          ) : (
            <img 
              src={url} 
              alt={media.original_filename} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          )}
          
          <div className="mt-6 flex items-center gap-3 bg-zinc-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-zinc-800 shadow-xl">
            <button 
              onClick={handleToggleLike}
              disabled={likeLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isLiked ? 'text-violet-400 bg-violet-400/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
              <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium text-sm">{likeCount}</span>
            </button>
            <div className="w-px h-6 bg-zinc-800 mx-1"></div>
            <button 
              onClick={handleToggleFavourite}
              disabled={favouriteLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isFavourited ? 'text-pink-500 bg-pink-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
              <Heart className={`w-5 h-5 ${isFavourited ? 'fill-current' : ''}`} />
              <span className="font-medium text-sm">Save</span>
            </button>
            <div className="w-px h-6 bg-zinc-800 mx-1"></div>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium text-sm">Share</span>
            </button>
            <div className="w-px h-6 bg-zinc-800 mx-1"></div>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium text-sm">Download</span>
            </button>
          </div>
        </div>

        {/* Sidebar Metadata & Comments Area */}
        <div className="w-full lg:w-96 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-[80vh] shrink-0 overflow-hidden">
          {/* Metadata Section */}
          <div className="p-6 border-b border-zinc-800 overflow-y-auto max-h-[50%] shrink-0 custom-scrollbar">
            <h3 className="text-xl font-bold text-white mb-6">Details</h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-zinc-500 mb-2 flex items-center"><User className="w-4 h-4 mr-1" /> Uploader</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold mr-3 text-xs">
                    {media.uploader?.full_name?.charAt(0) || '?'}
                  </div>
                  <span className="text-white text-sm">{media.uploader?.full_name || 'Unknown'}</span>
                </div>
              </div>

              {media.club && (
                <div>
                  <p className="text-sm text-zinc-500 mb-2 flex items-center"><Users className="w-4 h-4 mr-1" /> Club</p>
                  <p className="text-white text-sm font-medium">{media.club.name}</p>
                </div>
              )}

              {media.event && (
                <div>
                  <p className="text-sm text-zinc-500 mb-2 flex items-center"><Calendar className="w-4 h-4 mr-1" /> Event</p>
                  <p className="text-white text-sm font-medium">{media.event.title}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-zinc-500 mb-2 flex items-center"><Calendar className="w-4 h-4 mr-1" /> Uploaded</p>
                <p className="text-white text-sm">{new Date(media.created_at).toLocaleDateString()} at {new Date(media.created_at).toLocaleTimeString()}</p>
              </div>

              {media.ai_tags && media.ai_tags.length > 0 && (
                <div>
                  <p className="text-sm text-zinc-500 mb-2 flex items-center"><Tag className="w-4 h-4 mr-1" /> AI Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {media.ai_tags.map((tag: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tagged Users Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-zinc-500 flex items-center"><UserPlus className="w-4 h-4 mr-1" /> People</p>
                  {currentUser && (
                    <button 
                      onClick={() => setIsTagging(!isTagging)}
                      className="text-xs text-violet-400 hover:text-violet-300"
                    >
                      {isTagging ? 'Cancel' : '+ Tag Friend'}
                    </button>
                  )}
                </div>
                
                {isTagging && (
                  <div className="mb-3 relative">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search name or username..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                    />
                    {searchQuery.length > 2 && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-10 max-h-40 overflow-y-auto custom-scrollbar">
                        {searchLoading ? (
                          <div className="p-3 text-center"><Loader2 className="w-4 h-4 animate-spin text-zinc-400 mx-auto" /></div>
                        ) : searchResults.length === 0 ? (
                          <p className="p-3 text-xs text-zinc-400 text-center">No users found</p>
                        ) : (
                          searchResults.map(u => (
                            <button
                              key={u.id}
                              onClick={() => handleAddTag(u.id)}
                              className="w-full text-left px-3 py-2 hover:bg-zinc-700 flex flex-col transition-colors"
                            >
                              <span className="text-sm text-white font-medium">{u.full_name}</span>
                              <span className="text-xs text-zinc-400">@{u.username}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {allTaggedUsers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allTaggedUsers.map((user: any, i: number) => (
                      <div key={i} className={`flex items-center px-2.5 py-1 rounded-full border text-xs ${user.isAi ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}>
                        {user.full_name || user.username}
                        {!user.isAi && (currentUser?.id === user.id || currentUser?.id === user.taggedBy || isUploader) && (
                          <button 
                            onClick={() => handleRemoveTag(user.tagId)}
                            className="ml-2 text-cyan-500 hover:text-cyan-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-xs italic">No one tagged yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/50">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900 shrink-0">
              <h4 className="text-white font-semibold flex items-center text-sm">
                <MessageSquare className="w-4 h-4 mr-2 text-zinc-400" />
                Comments ({comments.length})
              </h4>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {commentsLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-zinc-500 animate-spin" /></div>
              ) : comments.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center italic py-4">No comments yet. Be the first!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold shrink-0 text-xs">
                      {comment.user.full_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="bg-zinc-800/50 rounded-2xl rounded-tl-none px-4 py-2.5">
                        <p className="text-xs font-semibold text-white mb-0.5">{comment.user.full_name}</p>
                        <p className="text-sm text-zinc-300 break-words">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 px-1">
                        <span className="text-[10px] text-zinc-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                        {currentUser?.id === comment.user_id && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-[10px] text-rose-500/0 group-hover:text-rose-500 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0">
              {currentUser ? (
                <form onSubmit={handleAddComment} className="flex gap-2 relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-full pl-4 pr-10 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                    disabled={submittingComment}
                  />
                  <button 
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white disabled:opacity-50 disabled:bg-zinc-800 transition-colors"
                  >
                    {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-center text-zinc-500">Sign in to leave a comment.</p>
              )}
            </div>
          </div>

          {/* Delete Action Wrapper (Only visible if uploader) */}
          {isUploader && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
              {deleteError && <p className="text-rose-500 text-xs mb-2 text-center">{deleteError}</p>}
              <Button 
                variant="destructive" 
                className="w-full bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-600/30 text-sm h-9"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete Photo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
