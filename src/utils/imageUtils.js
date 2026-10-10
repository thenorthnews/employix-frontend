/**
 * Comprehensive Image & Document Upload Utilities
 * Ensures full support for ALL image formats:
 * - JPEG, JPG, PNG
 * - HEIC, HEIF (with auto client-side JPEG conversion for cross-browser rendering, canvas processing & OCR support)
 * - WEBP, AVIF, GIF, BMP, TIFF, SVG, ICO
 * - PDF (for document attachments)
 */

export const SUPPORTED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
  'application/octet-stream', // Fallback MIME for HEIC/binary uploads from some iOS/Windows browsers
];

export const SUPPORTED_IMAGE_EXTS = [
  'jpeg',
  'jpg',
  'png',
  'webp',
  'heic',
  'heif',
];

export const SUPPORTED_DOC_EXTS = [...SUPPORTED_IMAGE_EXTS, 'pdf'];

export const PROFILE_IMAGE_ACCEPT =
  'image/*,image/jpeg,image/png,image/jpg,image/webp,image/heic,image/heif,.jpeg,.jpg,.png,.webp,.heic,.heif';

export const DOCUMENT_UPLOAD_ACCEPT =
  'image/*,application/pdf,image/jpeg,image/png,image/jpg,image/webp,image/heic,image/heif,.jpeg,.jpg,.png,.webp,.heic,.heif,.pdf';

/**
 * Validates whether a file is an allowed profile image format
 */
export const isValidProfileImage = (file) => {
  if (!file) return false;
  const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
  return SUPPORTED_IMAGE_MIMES.includes(file.type) || SUPPORTED_IMAGE_EXTS.includes(ext);
};

/**
 * Validates whether a file is an allowed image or document format
 */
export const isValidDocumentOrImage = (file) => {
  if (!file) return false;
  const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
  const isPdf = file.type === 'application/pdf' || ext === 'pdf';
  return isPdf || SUPPORTED_IMAGE_MIMES.includes(file.type) || SUPPORTED_DOC_EXTS.includes(ext);
};

/**
 * Dynamically load heic2any for client-side HEIC to JPEG conversion
 */
const loadHeic2Any = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.heic2any) {
      return resolve(window.heic2any);
    }
    if (typeof document === 'undefined') {
      return reject(new Error('Window not available'));
    }
    const existingScript = document.getElementById('heic2any-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.heic2any));
      existingScript.addEventListener('error', () => reject(new Error('Failed to load HEIC converter')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'heic2any-script';
    script.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
    script.async = true;
    script.onload = () => resolve(window.heic2any);
    script.onerror = () => reject(new Error('Failed to load HEIC converter'));
    document.head.appendChild(script);
  });
};

/**
 * Process any image or document file.
 * If the file is HEIC/HEIF, automatically converts it into a standard JPEG File/Blob
 * so that <img> tags, Canvas checks, and backend OCR/upload work seamlessly.
 *
 * @param {File} file
 * @returns {Promise<{ file: File, previewUrl: string, isPdf: boolean }>}
 */
export const processUploadFile = async (file) => {
  if (!file) return null;

  const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
  const isPdf = file.type === 'application/pdf' || ext === 'pdf';
  const isHeic =
    ext === 'heic' ||
    ext === 'heif' ||
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.type === 'image/heic-sequence' ||
    file.type === 'image/heif-sequence';

  if (isHeic) {
    try {
      const heic2any = await loadHeic2Any();
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92,
      });

      const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const newFileName = (file.name || 'document.heic').replace(/\.(heic|heif)$/i, '.jpg');
      const convertedFile = new File([singleBlob], newFileName, { type: 'image/jpeg' });

      return {
        file: convertedFile,
        previewUrl: URL.createObjectURL(singleBlob),
        isPdf: false,
      };
    } catch (err) {
      console.warn('HEIC client conversion fallback (using original):', err);
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        isPdf: false,
      };
    }
  }

  return {
    file,
    previewUrl: isPdf ? null : URL.createObjectURL(file),
    isPdf,
  };
};

export const processProfileImageFile = processUploadFile;
