'use client';

import { FC, useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Search,
  Filter,
  RefreshCw,
  X,
  Loader2,
  CheckSquare,
  Square,
  Maximize2,
  Calendar,
  HardDrive,
  Layers,
  Plus,
  AlertTriangle,
  Folder,
  MousePointerClick
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface MediaItem {
  public_id: string;
  format: string;
  version?: number;
  resource_type: string;
  type?: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  url: string;
  secure_url: string;
  folder?: string;
  filename?: string;
}

interface MediaGalleryProps {
  isPicker?: boolean;
  onSelectImage?: (url: string, item?: MediaItem) => void;
  onClosePicker?: () => void;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'Unknown';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

const MediaGallery: FC<MediaGalleryProps> = ({
  isPicker = false,
  onSelectImage,
  onClosePicker,
}) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState<boolean>(false);

  // Detail Modal
  const [activeDetailItem, setActiveDetailItem] = useState<MediaItem | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isDeletingSingle, setIsDeletingSingle] = useState<boolean>(false);
  const [showSingleDeleteConfirm, setShowSingleDeleteConfirm] = useState<boolean>(false);

  // Upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch Media Items from Backend
  const fetchMedia = async (cursor?: string | null, isRefresh = false) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();
      params.append('max_results', '60');
      if (cursor) params.append('next_cursor', cursor);

      const res = await fetch(`/api/media?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch media');
      }

      const data = await res.json();
      const newResources: MediaItem[] = data.resources || [];

      if (cursor) {
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.public_id));
          const filtered = newResources.filter((i) => !existingIds.has(i.public_id));
          return [...prev, ...filtered];
        });
      } else {
        setItems(newResources);
      }

      setNextCursor(data.next_cursor || null);
    } catch (error: any) {
      console.error('Error fetching media:', error);
      toast.error(`Media Gallery Error: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  // Filtered Items
  const formats = useMemo(() => {
    const list = Array.from(new Set(items.map((i) => (i.format || '').toLowerCase()).filter(Boolean)));
    return ['all', ...list];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.public_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.filename && item.filename.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.folder && item.folder.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchFormat =
        selectedFormat === 'all' ||
        (item.format && item.format.toLowerCase() === selectedFormat.toLowerCase());

      return matchSearch && matchFormat;
    });
  }, [items, searchQuery, selectedFormat]);

  // Upload handler (supports multiple files)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgressText(`Uploading ${files.length} item(s)...`);

    try {
      const base64List: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Processing file ${i + 1} of ${files.length}...`);
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        base64List.push(base64);
      }

      setUploadProgressText(`Saving to Cloudinary...`);
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: base64List,
          folder: 'cafe-little-karachi/gallery',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to upload images');
      }

      const data = await res.json();
      toast.success(`Successfully uploaded ${data.count || base64List.length} image(s) to Cloudinary!`);

      // Refresh list
      fetchMedia(null, true);
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Selection toggle
  const toggleSelectItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(filteredItems.map((i) => i.public_id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    const idsToDelete = Array.from(selectedIds);

    try {
      const res = await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_ids: idsToDelete }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Bulk delete failed');
      }

      toast.success(`Deleted ${idsToDelete.length} image(s) successfully.`);
      setItems((prev) => prev.filter((i) => !selectedIds.has(i.public_id)));
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
    } catch (err: any) {
      toast.error(`Failed to delete images: ${err.message}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Single Item Delete
  const handleSingleDelete = async (public_id: string) => {
    setIsDeletingSingle(true);
    try {
      const res = await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }

      toast.success('Image deleted from Cloudinary.');
      setItems((prev) => prev.filter((i) => i.public_id !== public_id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(public_id);
        return next;
      });
      setShowSingleDeleteConfirm(false);
      setActiveDetailItem(null);
    } catch (err: any) {
      toast.error(`Failed to delete image: ${err.message}`);
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Copy URL to Clipboard
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Cloudinary URL copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={`flex flex-col h-full space-y-4 ${isPicker ? 'p-1' : ''}`}>
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
        {/* Left: Search & Filter */}
        <div className="flex flex-1 items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name or folder..."
              className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Format selector */}
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-neutral-400 hidden sm:block" />
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="h-9 px-2.5 text-xs font-semibold rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#741052]"
            >
              {formats.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt === 'all' ? 'All Formats' : fmt.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Upload & Refresh actions */}
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMedia(null, true)}
            disabled={refreshing || loading}
            className="h-9 px-3 rounded-xl border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Refresh gallery"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Upload Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            multiple
            className="hidden"
            id="cloudinary-media-upload"
            disabled={isUploading}
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-9 px-4 rounded-xl bg-[#741052] hover:bg-[#5c0d41] text-white font-bold text-xs shadow-sm transition-all"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Upload Media</span>
              </>
            )}
          </Button>

          {isPicker && onClosePicker && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClosePicker}
              className="h-9 w-9 p-0 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Uploading indicator banner */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-fuchsia-50 dark:bg-fuchsia-950/40 border border-fuchsia-200 dark:border-fuchsia-900 rounded-xl flex items-center justify-between text-xs font-semibold text-fuchsia-800 dark:text-fuchsia-300"
        >
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#741052] dark:text-fuchsia-400" />
            <span>{uploadProgressText || 'Uploading media to Cloudinary...'}</span>
          </div>
          <span className="text-[11px] font-normal text-fuchsia-600 dark:text-fuchsia-400">Please do not close this tab</span>
        </motion.div>
      )}

      {/* Bulk Selection Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 text-white dark:bg-neutral-800 rounded-2xl shadow-md border border-neutral-700/50 text-xs font-semibold"
          >
            <div className="flex items-center gap-3">
              <span className="bg-[#741052] px-2 py-0.5 rounded-full text-[11px] font-bold">
                {selectedIds.size} Selected
              </span>
              <button
                onClick={selectedIds.size === filteredItems.length ? deselectAll : selectAllVisible}
                className="text-neutral-300 hover:text-white underline text-[11px]"
              >
                {selectedIds.size === filteredItems.length ? 'Deselect All' : 'Select All Filtered'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={isBulkDeleting}
                className="h-7 px-3 text-xs rounded-xl font-bold bg-rose-600 hover:bg-rose-700"
              >
                {isBulkDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                Delete ({selectedIds.size})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={deselectAll}
                className="h-7 px-2 text-xs rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-700"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Delete {selectedIds.size} Media Item(s)?
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  This action is irreversible and permanently deletes these assets from Cloudinary.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="rounded-xl text-xs"
                disabled={isBulkDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700"
              >
                {isBulkDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                Confirm Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="flex-1 overflow-y-auto min-h-[360px] max-h-[calc(100vh-280px)] pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-400 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#741052] dark:text-fuchsia-400" />
            <p className="text-xs font-semibold">Connecting to Cloudinary Media Library...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl text-center p-6">
            <div className="p-4 rounded-3xl bg-neutral-100 dark:bg-neutral-900 text-neutral-400 mb-3">
              <ImageIcon className="h-10 w-10 text-neutral-400" />
            </div>
            <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              {searchQuery || selectedFormat !== 'all' ? 'No matching media assets' : 'No media uploaded yet'}
            </h4>
            <p className="text-xs text-neutral-400 max-w-sm mt-1 mb-4">
              {searchQuery || selectedFormat !== 'all'
                ? 'Try clearing the search or filter to see more images.'
                : 'Upload banners, product photos, and menu graphics to your Cloudinary storage.'}
            </p>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-4 rounded-xl bg-[#741052] text-white text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Upload First Image
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.has(item.public_id);
              const displayName = item.filename || item.public_id.split('/').pop() || 'image';

              return (
                <div
                  key={item.public_id}
                  onClick={() => {
                    if (isPicker && onSelectImage) {
                      onSelectImage(item.secure_url, item);
                    } else {
                      setActiveDetailItem(item);
                    }
                  }}
                  className={`group relative rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer bg-white dark:bg-neutral-900 flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#741052] ring-2 ring-[#741052]/40 shadow-md'
                      : 'border-neutral-200/80 dark:border-neutral-800 hover:border-[#741052]/50 hover:shadow-md'
                  }`}
                >
                  {/* Aspect Ratio Image Container */}
                  <div className="relative aspect-square w-full bg-neutral-100 dark:bg-neutral-950 overflow-hidden flex items-center justify-center">
                    <img
                      src={item.secure_url}
                      alt={displayName}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Top Selection Checkbox Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleSelectItem(item.public_id, e)}
                      className={`absolute top-2 left-2 p-1.5 rounded-lg backdrop-blur-md transition-all z-10 ${
                        isSelected
                          ? 'bg-[#741052] text-white shadow'
                          : 'bg-black/40 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-black/60'
                      }`}
                      title={isSelected ? 'Deselect' : 'Select'}
                    >
                      {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>

                    {/* Format Badge */}
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-mono font-bold text-white uppercase tracking-wider">
                      {item.format || 'IMG'}
                    </span>

                    {/* Picker hover prompt */}
                    {isPicker && (
                      <div className="absolute inset-0 bg-[#741052]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-white dark:bg-neutral-900 text-[#741052] dark:text-fuchsia-400 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <MousePointerClick size={12} /> Choose
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Bottom Info */}
                  <div className="p-2.5 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1">
                    <p
                      className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate"
                      title={displayName}
                    >
                      {displayName}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span>{item.width && item.height ? `${item.width}×${item.height}` : 'Image'}</span>
                      <span>{formatBytes(item.bytes, 1)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Pagination */}
        {nextCursor && (
          <div className="flex justify-center py-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMedia(nextCursor)}
              disabled={loadingMore}
              className="rounded-xl text-xs font-bold border-neutral-300 dark:border-neutral-700 px-6 h-9"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Loading more media...
                </>
              ) : (
                'Load More Images'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* POPUP DETAIL MODAL (SIDE-BY-SIDE: IMAGE LEFT, METADATA & ACTIONS RIGHT) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeDetailItem && (
          <div
            className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={() => {
              if (!isDeletingSingle) {
                setActiveDetailItem(null);
                setShowSingleDeleteConfirm(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-4xl w-full max-h-[92vh] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
                <div className="flex items-center gap-2 truncate pr-4">
                  <ImageIcon className="h-4 w-4 text-[#741052] dark:text-fuchsia-400 shrink-0" />
                  <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate">
                    {activeDetailItem.filename || activeDetailItem.public_id.split('/').pop()}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                    {activeDetailItem.format}
                  </Badge>
                </div>
                <button
                  onClick={() => {
                    setActiveDetailItem(null);
                    setShowSingleDeleteConfirm(false);
                  }}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body: Left Image, Right Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto flex-1">
                {/* Left: Large Image Preview */}
                <div className="md:col-span-7 bg-neutral-950/90 dark:bg-black/90 p-6 flex flex-col items-center justify-center min-h-[280px] md:min-h-[460px] relative">
                  <div className="relative max-w-full max-h-[420px] flex items-center justify-center overflow-hidden rounded-xl border border-white/10 shadow-lg">
                    <img
                      src={activeDetailItem.secure_url}
                      alt={activeDetailItem.public_id}
                      className="max-h-[400px] w-auto max-w-full object-contain rounded-lg"
                    />
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="font-mono">
                      {activeDetailItem.width} × {activeDetailItem.height} px
                    </span>
                    <a
                      href={activeDetailItem.secure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-white transition-colors underline font-medium"
                    >
                      <ExternalLink size={12} /> Open original
                    </a>
                  </div>
                </div>

                {/* Right: Rich Metadata & Actions */}
                <div className="md:col-span-5 p-6 flex flex-col justify-between space-y-6 bg-white dark:bg-neutral-900">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <Layers size={13} className="text-[#741052] dark:text-fuchsia-400" />
                      Asset Specifications
                    </h4>

                    {/* Key Attributes List */}
                    <div className="space-y-3 bg-neutral-50 dark:bg-neutral-950/60 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 text-xs">
                      {/* Dimensions */}
                      <div className="flex justify-between items-center py-1 border-b border-neutral-200/50 dark:border-neutral-800/60">
                        <span className="text-neutral-500 font-medium">Dimensions</span>
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {activeDetailItem.width} × {activeDetailItem.height} px
                        </span>
                      </div>

                      {/* File Size */}
                      <div className="flex justify-between items-center py-1 border-b border-neutral-200/50 dark:border-neutral-800/60">
                        <span className="text-neutral-500 font-medium flex items-center gap-1">
                          <HardDrive size={12} /> File Size
                        </span>
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {formatBytes(activeDetailItem.bytes)}
                        </span>
                      </div>

                      {/* Format / Type */}
                      <div className="flex justify-between items-center py-1 border-b border-neutral-200/50 dark:border-neutral-800/60">
                        <span className="text-neutral-500 font-medium">Image Type</span>
                        <span className="font-mono font-bold uppercase text-[#741052] dark:text-fuchsia-400">
                          {activeDetailItem.format || 'N/A'}
                        </span>
                      </div>

                      {/* Upload Date */}
                      <div className="flex justify-between items-center py-1 border-b border-neutral-200/50 dark:border-neutral-800/60">
                        <span className="text-neutral-500 font-medium flex items-center gap-1">
                          <Calendar size={12} /> Uploaded On
                        </span>
                        <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                          {formatDate(activeDetailItem.created_at)}
                        </span>
                      </div>

                      {/* Cloudinary Public ID */}
                      <div className="py-1 space-y-1">
                        <span className="text-neutral-500 font-medium block flex items-center gap-1">
                          <Folder size={12} /> Public ID / Path
                        </span>
                        <span className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200 break-all block bg-white dark:bg-neutral-900 p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                          {activeDetailItem.public_id}
                        </span>
                      </div>
                    </div>

                    {/* Copy Link Field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Direct Cloudinary Link
                      </label>
                      <div className="flex gap-1.5">
                        <Input
                          readOnly
                          value={activeDetailItem.secure_url}
                          className="h-9 text-xs font-mono rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyUrl(activeDetailItem.secure_url)}
                          className={`h-9 px-3 rounded-xl font-bold text-xs shrink-0 transition-colors ${
                            copiedLink
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {copiedLink ? (
                            <>
                              <Check className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    {/* Picker Select button */}
                    {isPicker && onSelectImage && (
                      <Button
                        size="sm"
                        onClick={() => {
                          onSelectImage(activeDetailItem.secure_url, activeDetailItem);
                          setActiveDetailItem(null);
                        }}
                        className="w-full h-10 rounded-xl bg-[#741052] hover:bg-[#5c0d41] text-white font-bold text-xs shadow-md"
                      >
                        <Check className="h-4 w-4 mr-1.5" />
                        Choose & Use This Image
                      </Button>
                    )}

                    {/* Single Delete Confirmation Prompt */}
                    {showSingleDeleteConfirm ? (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
                        <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                          Permanently delete this image from Cloudinary?
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSingleDeleteConfirm(false)}
                            className="h-7 text-xs rounded-lg"
                            disabled={isDeletingSingle}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSingleDelete(activeDetailItem.public_id)}
                            disabled={isDeletingSingle}
                            className="h-7 text-xs rounded-lg font-bold bg-rose-600 hover:bg-rose-700"
                          >
                            {isDeletingSingle ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            Yes, Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowSingleDeleteConfirm(true)}
                        className="w-full h-9 rounded-xl font-bold text-xs bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete Asset from Cloudinary
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MediaGallery;
