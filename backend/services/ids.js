const crypto = require("node:crypto");
const mongoose = require("mongoose");

// The frontend makes ids for new things so it can show them right away.
// Use theirs if it is a real ObjectId string, otherwise let Mongo make one.
function clientId(value) {
    return typeof value === "string" && /^[0-9a-f]{24}$/i.test(value) ? value : new mongoose.Types.ObjectId().toString();
}

function isId(value) {
    return typeof value === "string" && /^[0-9a-f]{24}$/i.test(value);
}

// Private participant link token (the part after /p/ in the link)
function newLinkToken() {
    return crypto.randomBytes(16).toString("base64url");
}

module.exports = { clientId, isId, newLinkToken };
