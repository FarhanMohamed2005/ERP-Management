const config = require('../config');
const ApiError = require('../utils/ApiError');

/**
 * Validates file upload constraints
 * Checks file size and type
 */
const validateFileUpload = (allowedTypes = null) => {
  return (req, res, next) => {
    try {
      // Check if rows exist in request body (for CSV imports)
      if (req.body && req.body.rows) {
        const rows = req.body.rows;

        // Validate rows is an array
        if (!Array.isArray(rows)) {
          throw new ApiError(400, 'Invalid data format: rows must be an array');
        }

        // Check array size limit (simulate file size validation)
        const estimatedSize = JSON.stringify(rows).length;
        const maxSizeBytes = config.fileUpload.maxFileSizeMB * 1024 * 1024;

        if (estimatedSize > maxSizeBytes) {
          throw new ApiError(
            413,
            `File size exceeds limit of ${config.fileUpload.maxFileSizeMB}MB`
          );
        }

        // Limit number of rows to prevent DoS
        const MAX_ROWS = 10000;
        if (rows.length > MAX_ROWS) {
          throw new ApiError(
            400,
            `Too many rows (${rows.length}). Maximum allowed: ${MAX_ROWS}`
          );
        }
      }

      // Check if file exists in request (for multipart uploads)
      if (req.file) {
        const maxSizeBytes = config.fileUpload.maxFileSizeMB * 1024 * 1024;

        // Check file size
        if (req.file.size > maxSizeBytes) {
          throw new ApiError(
            413,
            `File size exceeds limit of ${config.fileUpload.maxFileSizeMB}MB`
          );
        }

        // Check file type if specified
        if (allowedTypes && allowedTypes.length > 0) {
          const fileExt = '.' + req.file.originalname.split('.').pop().toLowerCase();
          if (!allowedTypes.includes(fileExt)) {
            throw new ApiError(
              400,
              `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
            );
          }
        }
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      next(new ApiError(400, 'File validation failed: ' + error.message));
    }
  };
};

/**
 * Rate limit for file uploads (per user)
 * Prevents abuse of bulk import functionality
 */
const fileUploadRateLimit = () => {
  const uploads = new Map();

  return (req, res, next) => {
    const userId = req.user?._id?.toString() || req.ip;
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    const maxUploads = 5; // 5 uploads per minute per user

    // Clean old entries
    if (!uploads.has(userId)) {
      uploads.set(userId, []);
    }

    const userUploads = uploads.get(userId);
    const recentUploads = userUploads.filter((time) => now - time < timeWindow);

    if (recentUploads.length >= maxUploads) {
      return next(
        new ApiError(
          429,
          `Too many uploads. Maximum ${maxUploads} per minute allowed`
        )
      );
    }

    recentUploads.push(now);
    uploads.set(userId, recentUploads);

    next();
  };
};

module.exports = { validateFileUpload, fileUploadRateLimit };
