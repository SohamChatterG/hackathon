// src/middlewares/internalAuthMiddleware.js

const internalAuth = (req, res, next) => {
    const apiKey = req.headers['x-internal-api-key'];

    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
        return res.status(401).json({ message: 'Unauthorized: Missing or invalid internal API key.' });
    }

    next();
};

module.exports = internalAuth;