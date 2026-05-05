// this is for error handling

/**
 * Centrally handles API errors and returns a user-friendly message.
 * @param {object} error - The error object from Axios.
 * @returns {string} - A formatted error message.
 */
export const handleError = (error) => {
    // 1. Check for response from server
    if (error.response && error.response.data) {
        const data = error.response.data;

        // Validation errors (Mongoose)
        if (data.errors && Array.isArray(data.errors)) {
            return data.errors.join(', ');
        }

        // Specific error details (Multer / Others)
        if (data.error) {
            return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        }

        // High-level message
        if (data.message) {
            return data.message;
        }
    }

    // 2. Check for request made but no response (Network error)
    if (error.request) {
        return "No response from server. Please check your internet connection.";
    }

    // 3. Something happened in setting up the request that triggered an Error
    return error.message || "An unexpected error occurred.";
};
