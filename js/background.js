import * as Sentry from '@sentry/browser';

Sentry.init({
    dsn: "https://0cd20cd0af1176800c70f078797e7a3c@o322105.ingest.sentry.io/4505964366004224",
    tracesSampleRate: 1.0,
});

// Listen for connections from content scripts
chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((message) => {
        console.log('Received message:', message); // Log the received message
        if (message.type === 'error') {
            console.log('Capturing exception:', message.error); // Log the exception being captured
            Sentry.captureException(new Error(message.error));
        }
    });
});