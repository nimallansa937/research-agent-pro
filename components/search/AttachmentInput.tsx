import React, { useState, useRef } from 'react';
import {
    FileText,
    Link as LinkIcon,
    Image as ImageIcon,
    X,
    Upload,
    ExternalLink,
    File,
    Loader2
} from 'lucide-react';
import { Attachment, SUPPORTED_DOCUMENT_TYPES, SUPPORTED_IMAGE_TYPES } from '../../types';

interface AttachmentInputProps {
    attachments: Attachment[];
    onAttachmentsChange: (attachments: Attachment[]) => void;
    disabled?: boolean;
}

const AttachmentInput: React.FC<AttachmentInputProps> = ({
    attachments,
    onAttachmentsChange,
    disabled = false
}) => {
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkError, setLinkError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const generateId = () => `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        const newAttachments: Attachment[] = [];

        for (const file of Array.from(files)) {
            if (!SUPPORTED_DOCUMENT_TYPES.includes(file.type)) {
                console.warn(`Unsupported file type: ${file.type}`);
                continue;
            }

            try {
                let content = '';

                // For text files, read as text
                if (file.type === 'text/plain' || file.type === 'text/markdown') {
                    content = await readFileAsText(file);
                } else {
                    // For PDF/DOCX, store as base64 (text extraction would need additional libraries)
                    content = await readFileAsBase64(file);
                }

                newAttachments.push({
                    id: generateId(),
                    type: 'document',
                    name: file.name,
                    content,
                    mimeType: file.type,
                    size: file.size,
                    addedAt: new Date()
                });
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
            }
        }

        onAttachmentsChange([...attachments, ...newAttachments]);
        setIsProcessing(false);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        const newAttachments: Attachment[] = [];

        for (const file of Array.from(files)) {
            if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
                console.warn(`Unsupported image type: ${file.type}`);
                continue;
            }

            try {
                const content = await readFileAsBase64(file);
                const url = URL.createObjectURL(file);

                newAttachments.push({
                    id: generateId(),
                    type: 'image',
                    name: file.name,
                    content,
                    url,
                    mimeType: file.type,
                    size: file.size,
                    addedAt: new Date()
                });
            } catch (error) {
                console.error(`Error processing image ${file.name}:`, error);
            }
        }

        onAttachmentsChange([...attachments, ...newAttachments]);
        setIsProcessing(false);

        // Reset input
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleAddLink = () => {
        setLinkError('');

        if (!linkUrl.trim()) {
            setLinkError('Please enter a URL');
            return;
        }

        // Validate URL
        try {
            new URL(linkUrl);
        } catch {
            setLinkError('Please enter a valid URL');
            return;
        }

        const newAttachment: Attachment = {
            id: generateId(),
            type: 'link',
            name: new URL(linkUrl).hostname,
            url: linkUrl,
            addedAt: new Date()
        };

        onAttachmentsChange([...attachments, newAttachment]);
        setLinkUrl('');
        setShowLinkInput(false);
    };

    const handleRemoveAttachment = (id: string) => {
        // Revoke blob URLs for images to prevent memory leaks
        const attachment = attachments.find(a => a.id === id);
        if (attachment?.type === 'image' && attachment.url?.startsWith('blob:')) {
            URL.revokeObjectURL(attachment.url);
        }

        onAttachmentsChange(attachments.filter(a => a.id !== id));
    };

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix to get just the base64
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getAttachmentIcon = (attachment: Attachment) => {
        switch (attachment.type) {
            case 'document':
                return <FileText className="w-4 h-4 text-blue-400" />;
            case 'link':
                return <ExternalLink className="w-4 h-4 text-green-400" />;
            case 'image':
                return <ImageIcon className="w-4 h-4 text-purple-400" />;
            default:
                return <File className="w-4 h-4 text-neutral-400" />;
        }
    };

    return (
        <div className="space-y-3">
            {/* Attachment Buttons */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">Attach:</span>

                {/* Document Upload */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    multiple
                    onChange={handleDocumentUpload}
                    className="hidden"
                    disabled={disabled || isProcessing}
                    title="Upload documents"
                    aria-label="Upload documents (PDF, DOCX, TXT)"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isProcessing}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs text-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add Document (PDF, DOCX, TXT)"
                >
                    <FileText className="w-3.5 h-3.5" />
                    Document
                </button>

                {/* Link Input */}
                <button
                    type="button"
                    onClick={() => setShowLinkInput(!showLinkInput)}
                    disabled={disabled || isProcessing}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs text-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add Link"
                >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Link
                </button>

                {/* Image Upload */}
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={disabled || isProcessing}
                    title="Upload images"
                    aria-label="Upload images (JPG, PNG, GIF)"
                />
                <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={disabled || isProcessing}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs text-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add Image (JPG, PNG, GIF)"
                >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Image
                </button>

                {isProcessing && (
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                )}
            </div>

            {/* Link Input Field */}
            {showLinkInput && (
                <div className="flex items-center gap-2 p-2 bg-neutral-800/50 rounded-lg border border-neutral-700">
                    <LinkIcon className="w-4 h-4 text-neutral-400" />
                    <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com/article"
                        className="flex-1 bg-transparent text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddLink();
                            }
                            if (e.key === 'Escape') {
                                setShowLinkInput(false);
                                setLinkUrl('');
                            }
                        }}
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={handleAddLink}
                        className="px-2 py-1 bg-purple-500 hover:bg-purple-600 rounded text-xs text-white transition-colors"
                    >
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowLinkInput(false);
                            setLinkUrl('');
                            setLinkError('');
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-200"
                        title="Cancel"
                        aria-label="Cancel adding link"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            {linkError && (
                <p className="text-xs text-red-400">{linkError}</p>
            )}

            {/* Attached Items */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="flex items-center gap-2 px-2.5 py-1.5 bg-neutral-800/80 border border-neutral-700 rounded-lg group"
                        >
                            {/* Image Preview */}
                            {attachment.type === 'image' && attachment.url && (
                                <img
                                    src={attachment.url}
                                    alt={attachment.name}
                                    className="w-6 h-6 rounded object-cover"
                                />
                            )}

                            {/* Icon for non-images */}
                            {attachment.type !== 'image' && getAttachmentIcon(attachment)}

                            {/* Name */}
                            <span className="text-xs text-neutral-300 max-w-[120px] truncate" title={attachment.name}>
                                {attachment.type === 'link' ? attachment.url : attachment.name}
                            </span>

                            {/* Size (for files) */}
                            {attachment.size && (
                                <span className="text-xs text-neutral-500">
                                    {formatFileSize(attachment.size)}
                                </span>
                            )}

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => handleRemoveAttachment(attachment.id)}
                                disabled={disabled}
                                className="p-0.5 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AttachmentInput;
