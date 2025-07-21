export default function getBaseUrl() {
  if (process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  return 'http://localhost:3000'; // fallback mặc định
} 