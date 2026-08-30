const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  APP_NAME: import.meta.env.VITE_APP_NAME || "SchoolMIS",
  VERSION: "1.0.0",
  TIMEOUT: 10000, // 10 seconds
  TOKEN_KEY: "mis_auth_token",
  REFRESH_TOKEN_KEY: "mis_refresh_token",
  TENANT_KEY: "mis_tenant_id",
};

export default config;
