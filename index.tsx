import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Debug logging
console.log('🚀 Jainn AI Starting...', {
  mode: import.meta.env.MODE,
  hasGeminiKey: !!import.meta.env.GEMINI_API_KEY,
  hasOpenRouter: !!import.meta.env.OPENROUTER_API_KEY,
  hasSupabase: !!import.meta.env.VITE_SUPABASE_URL
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-family: monospace; text-align: center; margin-top: 50px;">
      <h1>❌ Critical Error</h1>
      <p>Root element not found in DOM</p>
    </div>
  `;
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Render Error:', error);
  rootElement.innerHTML = `
    <div style="color: red; padding: 20px; font-family: monospace; text-align: center; margin-top: 50px;">
      <h1>❌ Application Error</h1>
      <pre style="background: #000; padding: 20px; border-radius: 8px; text-align: left; overflow: auto;">${error instanceof Error ? error.stack : String(error)}</pre>
      <p style="margin-top: 20px;">Check the browser console (F12) for more details</p>
    </div>
  `;
}
