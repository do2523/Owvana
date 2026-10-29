function errorHandler(error, req, res, next) {
    console.error(error);

    if (error.code === 11000) {
        res.status(409).json({ message: "An account with that email already exists." });
        return;
    }

    res.status(500).json({ message: "An unexpected server error occurred." });
}

module.exports = errorHandler;