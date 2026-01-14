import { useState, useRef } from 'react';
import { useUI } from '../../context/UIContext';

const ImageUpload = ({ images = [], onChange, maxImages = 5, maxSizeMB = 5 }) => {
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const { showError, showWarning } = useUI();

    const validateFile = (file) => {
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showError(`${file.name}: Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.`);
            return false;
        }

        // Check file size
        const maxSize = maxSizeMB * 1024 * 1024;
        if (file.size > maxSize) {
            showError(`${file.name}: File size exceeds ${maxSizeMB}MB limit.`);
            return false;
        }

        return true;
    };

    const handleFiles = (files) => {
        const fileArray = Array.from(files);
        const currentCount = images.length;
        const newCount = currentCount + fileArray.length;

        // Check max images
        if (newCount > maxImages) {
            showWarning(`Maximum ${maxImages} images allowed. Only adding first ${maxImages - currentCount} images.`);
            const validFiles = fileArray.slice(0, maxImages - currentCount).filter(validateFile);
            onChange([...images, ...validFiles]);
            return;
        }

        // Validate all files
        const validFiles = fileArray.filter(validateFile);
        if (validFiles.length > 0) {
            onChange([...images, ...validFiles]);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const removeImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        onChange(newImages);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleChange}
                    className="hidden"
                />

                <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                >
                    <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>

                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-primary"
                        disabled={images.length >= maxImages}
                    >
                        Choose Images
                    </button>
                    <p className="mt-2 text-sm text-gray-600">
                        or drag and drop images here
                    </p>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                    PNG, JPG, GIF, WEBP up to {maxSizeMB}MB (Max {maxImages} images)
                </p>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                        Selected Images ({images.length}/{maxImages})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {images.map((file, index) => (
                            <div key={index} className="relative group">
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="Remove image"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                {/* File Info */}
                                <div className="mt-1 text-xs text-gray-600 truncate">
                                    <p className="truncate">{file.name}</p>
                                    <p className="text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
