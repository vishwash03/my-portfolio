/**
 * ADVANCED REAL-TIME VISITOR TRACKER
 * Tracks visitors with device detection, location, and live updates
 * Include: <script src="visitor-tracker-advanced.js"></script>
 */

(function() {
    // ===== DEVICE DETECTION =====
    function detectDevice() {
        const ua = navigator.userAgent.toLowerCase();
        let device = 'desktop';
        let os = 'unknown';
        let browser = 'unknown';
        let screenSize = 'unknown';

        // Detect OS
        if (/windows/.test(ua)) os = 'Windows';
        else if (/mac/.test(ua)) os = 'macOS';
        else if (/linux/.test(ua)) os = 'Linux';
        else if (/iphone|ipad|ipod/.test(ua)) os = 'iOS';
        else if (/android/.test(ua)) os = 'Android';

        // Detect Device Type
        if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua)) {
            device = 'mobile';
        } else if (/tablet|ipad|kindle|playbook|silk|nexus 7|nexus 10|xoom|sch-i800|gt-p1000/.test(ua)) {
            device = 'tablet';
        }

        // Detect Browser
        if (/edge/.test(ua)) browser = 'Edge';
        else if (/chrome/.test(ua)) browser = 'Chrome';
        else if (/firefox/.test(ua)) browser = 'Firefox';
        else if (/safari/.test(ua)) browser = 'Safari';
        else if (/trident/.test(ua)) browser = 'IE';
        else if (/opera|opr/.test(ua)) browser = 'Opera';

        // Screen Size Category
        const width = window.innerWidth;
        if (width < 480) screenSize = 'small-mobile';
        else if (width < 768) screenSize = 'mobile';
        else if (width < 1024) screenSize = 'tablet';
        else screenSize = 'desktop';

        return {
            device,
            os,
            browser,
            screenSize,
            screenResolution: `${window.innerWidth}×${window.innerHeight}`,
            viewport: `${window.innerWidth}×${window.innerHeight}`,
            userAgent: ua
        };
    }

    // ===== GEOLOCATION (Simulated from IP) =====
    async function getLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
                const data = await response.json();
                return {
                    country: data.country_name || 'Unknown',
                    city: data.city || 'Unknown',
                    ip: data.ip || 'Unknown',
                    timezone: data.timezone || 'Unknown',
                    isp: data.org || 'Unknown'
                };
            }
        } catch (e) {
            // Fallback if API unavailable
        }
        return {
            country: 'Unknown',
            city: 'Unknown',
            ip: 'Unknown',
            timezone: 'Unknown',
            isp: 'Unknown'
        };
    }

    // ===== TRACK VISITOR =====
    async function trackVisitor() {
        try {
            const deviceInfo = detectDevice();
            const locationInfo = await getLocation();
            
            // Calculate time on page
            const sessionId = sessionStorage.getItem('_session_id') || 
                            'session_' + Date.now();
            sessionStorage.setItem('_session_id', sessionId);

            const visitorData = {
                page: window.location.pathname || '/',
                title: document.title || 'Unknown',
                referrer: document.referrer || 'direct',
                timestamp: new Date().toISOString(),
                sessionId: sessionId,
                language: navigator.language || 'unknown',
                
                // Device Information
                deviceType: deviceInfo.device,
                os: deviceInfo.os,
                browser: deviceInfo.browser,
                screenSize: deviceInfo.screenSize,
                screenResolution: deviceInfo.screenResolution,
                viewport: deviceInfo.viewport,
                
                // Location Information
                country: locationInfo.country,
                city: locationInfo.city,
                ip: locationInfo.ip,
                timezone: locationInfo.timezone,
                isp: locationInfo.isp,
                
                // Connection
                connection: navigator.connection ? 
                    navigator.connection.effectiveType : 'unknown',
                
                // Performance
                timeOnPage: 0
            };

            // Send to backend
            fetch('http://localhost:3000/api/visitors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(visitorData)
            }).catch(error => {
                console.log('Visitor tracking: Backend unavailable');
            });

        } catch (error) {
            console.log('Visitor tracking error:', error);
        }
    }

    // ===== TRACK PAGE TIME =====
    function trackTimeOnPage() {
        let timeOnPage = 0;
        setInterval(() => {
            timeOnPage++;
            if (timeOnPage % 30 === 0) { // Update every 30 seconds
                sessionStorage.setItem('_time_on_page', timeOnPage);
            }
        }, 1000);
    }

    // ===== TRACK SCROLL =====
    function trackScroll() {
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                sessionStorage.setItem('_max_scroll', maxScroll.toFixed(2));
            }
        });
    }

    // ===== TRACK CLICKS =====
    function trackClicks() {
        let clickCount = 0;
        document.addEventListener('click', () => {
            clickCount++;
            sessionStorage.setItem('_click_count', clickCount);
        });
    }

    // ===== DETECT DEVICE CSS =====
    function injectDeviceCSS() {
        const deviceInfo = detectDevice();
        
        // Set data attribute on HTML element for CSS targeting
        document.documentElement.setAttribute('data-device', deviceInfo.device);
        document.documentElement.setAttribute('data-os', deviceInfo.os);
        document.documentElement.setAttribute('data-browser', deviceInfo.browser);
        document.documentElement.setAttribute('data-screen-size', deviceInfo.screenSize);

        // Create style tag for device-specific CSS
        const style = document.createElement('style');
        style.id = 'device-detection-css';
        
        let css = '';

        // Device-specific CSS
        if (deviceInfo.device === 'mobile') {
            css += `
                html[data-device="mobile"] { --device-type: mobile; }
                html[data-device="mobile"] body { font-size: 14px; }
                html[data-device="mobile"] .desktop-only { display: none; }
            `;
        } else if (deviceInfo.device === 'tablet') {
            css += `
                html[data-device="tablet"] { --device-type: tablet; }
                html[data-device="tablet"] body { font-size: 15px; }
                html[data-device="tablet"] .desktop-only { display: block; }
            `;
        } else {
            css += `
                html[data-device="desktop"] { --device-type: desktop; }
                html[data-device="desktop"] body { font-size: 16px; }
            `;
        }

        // Screen size specific CSS
        if (deviceInfo.screenSize === 'small-mobile') {
            css += `
                html[data-screen-size="small-mobile"] body { padding: 8px; }
                html[data-screen-size="small-mobile"] .btn { min-height: 40px; }
            `;
        } else if (deviceInfo.screenSize === 'mobile') {
            css += `
                html[data-screen-size="mobile"] body { padding: 12px; }
                html[data-screen-size="mobile"] .btn { min-height: 44px; }
            `;
        }

        // OS-specific CSS (e.g., iOS quirks)
        if (deviceInfo.os === 'iOS') {
            css += `
                html[data-os="iOS"] input { font-size: 16px !important; }
                html[data-os="iOS"] select { font-size: 16px !important; }
                html[data-os="iOS"] textarea { font-size: 16px !important; }
                html[data-os="iOS"] body { -webkit-user-select: none; }
            `;
        }

        style.textContent = css;
        document.head.appendChild(style);
    }

    // ===== INIT =====
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                injectDeviceCSS();
                trackVisitor();
                trackTimeOnPage();
                trackScroll();
                trackClicks();
            });
        } else {
            injectDeviceCSS();
            trackVisitor();
            trackTimeOnPage();
            trackScroll();
            trackClicks();
        }
    }

    init();
})();
