import { toast } from 'react-toastify';

/**
 * Clean & shorten error messages to ensure they are short, valid, and user-friendly.
 */
function cleanErrorMessage(msg) {
  if (!msg) return 'An error occurred. Please try again.';
  if (typeof msg !== 'string') {
    if (msg.message) return cleanErrorMessage(msg.message);
    return 'Action failed. Please try again.';
  }

  let text = msg.trim();

  // Strip JSON or backend stack clutter
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.message) return cleanErrorMessage(parsed.message);
    } catch {
      // ignore
    }
  }

  // Remove common verbose prefixes
  text = text.replace(/^Error:\s*/i, '');
  text = text.replace(/^Request failed with status code \d+:\s*/i, '');
  text = text.replace(/^AxiosError:\s*/i, '');

  // Truncate overly long error messages to 90 characters
  if (text.length > 95) {
    text = text.substring(0, 92) + '...';
  }

  return text;
}

/**
 * Clean & shorten success messages.
 */
function cleanSuccessMessage(msg) {
  if (!msg) return 'Action completed successfully.';
  if (typeof msg !== 'string') {
    if (msg.message) return cleanSuccessMessage(msg.message);
    return 'Action completed successfully.';
  }
  return msg.trim();
}

// Store original references
const originalSuccess = toast.success?.bind(toast);
const originalError = toast.error?.bind(toast);
const originalWarn = toast.warn?.bind(toast);
const originalInfo = toast.info?.bind(toast);

// 1. Success -> Show standard toast (or modal only if explicitly requested with options.showModal: true)
toast.success = (content, options = {}) => {
  const message = cleanSuccessMessage(content);
  if (options.showModal && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app:show-success-modal', {
        detail: {
          message,
          title: options.title || 'Success!',
          buttonText: options.buttonText || 'Got It',
        },
      })
    );
  }
  return originalSuccess(message, {
    position: 'top-right',
    autoClose: 3500,
    ...options,
  });
};

// 2. Error -> Show in Toastify on Right Side
toast.error = (content, options = {}) => {
  const message = cleanErrorMessage(content);
  return originalError(message, {
    position: 'top-right',
    autoClose: 3500,
    ...options,
  });
};

// 3. Warn -> Show in Toastify on Right Side
toast.warn = (content, options = {}) => {
  const message = cleanErrorMessage(content);
  return originalWarn(message, {
    position: 'top-right',
    autoClose: 3500,
    ...options,
  });
};

// 4. Info -> Show in Toastify on Right Side
toast.info = (content, options = {}) => {
  const message = cleanErrorMessage(content);
  return originalInfo(message, {
    position: 'top-right',
    autoClose: 3500,
    ...options,
  });
};

export { cleanErrorMessage, cleanSuccessMessage };
