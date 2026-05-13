/**
 * Utilitaire pour standardiser les réponses API
 */
const sendResponse = (res, statusCode, data, message = null, meta = null) => {
    const response = {
        success: statusCode >= 200 && statusCode < 300,
        message,
        data,
        timestamp: new Date().toISOString()
    };
    if (meta) {
        response.meta = meta;
    }
    return res.status(statusCode).json(response);
};

const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

module.exports = { sendResponse, sendError };
