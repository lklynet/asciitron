window.ENV = {
    API_KEY: window.__ENV?.API_KEY || document.querySelector('meta[name="api-key"]')?.content || ''
};

// Inject API key from Cloudflare Pages environment variables
if (window.__ENV && window.__ENV.API_KEY) {
    const meta = document.createElement('meta');
    meta.name = 'api-key';
    meta.content = window.__ENV.API_KEY;
    document.head.appendChild(meta);
}