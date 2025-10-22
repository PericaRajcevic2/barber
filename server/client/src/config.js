// API Configuration
// U produkciji koristimo isti origin (Render služi i frontend i backend),
// u razvoju koristimo VITE_API_URL ili localhost:5000
export const API_URL = import.meta.env.PROD
	? window.location.origin
	: (import.meta.env.VITE_API_URL || 'http://localhost:5000');

export default API_URL;
