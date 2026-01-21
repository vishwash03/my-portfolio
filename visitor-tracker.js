/**
 * VISITOR TRACKING SYSTEM
 * Automatically tracks page visits and sends data to backend
 * Include this script in the <head> of all pages:
 * <script src="visitor-tracker.js"></script>
 */

(function() {
    // Track visitor on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackVisitor);
    } else {
        trackVisitor();
    }

    function trackVisitor() {
        try {
            const visitorData = {
                page: window.location.pathname || window.location.href,
                userAgent: navigator.userAgent,
                referrer: document.referrer || 'direct',
                timestamp: new Date().toISOString()
            };

            // Send to backend
            fetch('http://localhost:3000/api/visitors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(visitorData)
            }).catch(error => {
                // Silent fail - don't break page if tracking fails
                console.log('Visitor tracking: Backend unavailable');
            });
        } catch (error) {
            // Silent fail
            console.log('Visitor tracking error:', error);
        }
    }
})();
