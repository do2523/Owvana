import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { ProxyOptions } from "vite";

// Page loads should get the React app, only fetch calls go to the backend
const backend: ProxyOptions = {
  target: "http://localhost:5000",
  bypass: (req) =>
    req.headers.accept?.includes("text/html") ? "/index.html" : undefined,
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: ["copproject.us", "www.copproject.us"],
    proxy: {
      "/register": backend,
      "/login": backend,
      "/verifyEmail": backend,
      "/resetPassword": backend,
      "/resendVerification": backend,
      "/forgotPassword": backend,
      "/data": backend,
      "/updateProfile": backend,
      "/createGroup": backend,
      "/updateGroup": backend,
      "/deleteGroup": backend,
      "/addToGroup": backend,
      "/updateParticipant": backend,
      "/removeFromGroup": backend,
      "/createCategory": backend,
      "/renameCategory": backend,
      "/deleteCategory": backend,
      "/saveExpense": backend,
      "/deleteExpense": backend,
      "/recordPayment": backend,
      "/confirmPayment": backend,
      "/deleteUser": backend,
      "/link": backend,
    },
  },
});
