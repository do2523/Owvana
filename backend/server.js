const app = require("./app");
const connectDB = require("./database/db");
const { mongoUri, port } = require("./config/env");

async function startServer() {
    await connectDB(mongoUri);
    app.listen(port, () => {
        console.log(`Backend listening on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error("Unable to start backend:", error);
    process.exitCode = 1;
});