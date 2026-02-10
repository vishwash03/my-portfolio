const fs = require('fs');
const path = require('path');

// Read the INDEX.HTML file
const filePath = path.join(__dirname, 'INDEX.HTML');
let htmlContent = fs.readFileSync(filePath, 'utf-8');

// CSS to add for the scroll-to-top button
const scrollToTopCSS = `
        /* ===== SCROLL TO TOP BUTTON ===== */
        @keyframes bounceArrow {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-8px);
            }
        }

        @keyframes fadeInScroll {
            from {
                opacity: 0;
                transform: scale(0.7);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes fadeOutScroll {
            from {
                opacity: 1;
                transform: scale(1);
            }
            to {
                opacity: 0;
                transform: scale(0.7);
            }
        }

        .scroll-top-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: none;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 99;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
            transition: all 0.3s ease;
            opacity: 0;
            transform: scale(0.7);
        }

        .scroll-top-btn.show {
            display: flex;
            animation: fadeInScroll 0.5s ease forwards;
        }

        .scroll-top-btn.hide {
            animation: fadeOutScroll 0.5s ease forwards;
        }

        .scroll-top-btn:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            box-shadow: 0 8px 30px rgba(59, 130, 246, 0.6);
            transform: translateY(-3px);
        }

        .scroll-top-btn:active {
            transform: translateY(-1px);
        }

        .scroll-top-btn svg {
            width: 24px;
            height: 24px;
            animation: bounceArrow 1.5s ease-in-out infinite;
        }

        .scroll-top-btn svg path {
            fill: #ffffff;
        }

        /* Responsive design for mobile */
        @media (max-width: 767px) {
            .scroll-top-btn {
                width: 45px;
                height: 45px;
                bottom: 20px;
                right: 20px;
            }

            .scroll-top-btn svg {
                width: 20px;
                height: 20px;
            }
        }

        @media (max-width: 479px) {
            .scroll-top-btn {
                width: 45px;
                height: 45px;
                bottom: 15px;
                right: 15px;
            }

            .scroll-top-btn svg {
                width: 18px;
                height: 18px;
            }
        }
`;

// HTML button element to add (before closing body tag)
const scrollToTopHTML = `    <!-- Scroll to Top Button -->
    <button class="scroll-top-btn" id="scrollTopBtn" aria-label="Scroll to top">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 14l5-5 5 5z"/>
        </svg>
    </button>
`;

// JavaScript code to add (before closing body tag)
const scrollToTopJS = `    <script>
        // Scroll to Top Button Functionality
        const scrollTopBtn = document.getElementById('scrollTopBtn');

        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                if (!scrollTopBtn.classList.contains('show')) {
                    scrollTopBtn.classList.remove('hide');
                    scrollTopBtn.classList.add('show');
                }
            } else {
                if (scrollTopBtn.classList.contains('show')) {
                    scrollTopBtn.classList.remove('show');
                    scrollTopBtn.classList.add('hide');
                    setTimeout(() => {
                        scrollTopBtn.classList.remove('hide');
                    }, 500);
                }
            }
        });

        // Scroll to top when button is clicked
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Add ripple effect on click
        scrollTopBtn.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.5)';
            ripple.style.pointerEvents = 'none';
            ripple.style.animation = 'ripple-animation 0.6s ease-out';
            
            const rect = scrollTopBtn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            scrollTopBtn.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });

        // Add ripple animation keyframes
        if (!document.getElementById('ripple-animation-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-animation-style';
            style.textContent = \`
                @keyframes ripple-animation {
                    from {
                        opacity: 1;
                        transform: scale(0);
                    }
                    to {
                        opacity: 0;
                        transform: scale(1);
                    }
                }
            \`;
            document.head.appendChild(style);
        }
    </script>
`;

// Find the insertion points
const styleClosingTag = htmlContent.lastIndexOf('</style>');
const bodyClosingTag = htmlContent.lastIndexOf('</body>');

if (styleClosingTag === -1 || bodyClosingTag === -1) {
    console.error('Error: Could not find </style> or </body> tags in INDEX.HTML');
    process.exit(1);
}

// Insert CSS before </style>
htmlContent = htmlContent.substring(0, styleClosingTag) + 
             scrollToTopCSS + 
             htmlContent.substring(styleClosingTag);

// Insert HTML and JavaScript before </body>
htmlContent = htmlContent.substring(0, bodyClosingTag) + 
             '\n' + scrollToTopHTML + '\n' + scrollToTopJS + '\n' +
             htmlContent.substring(bodyClosingTag);

// Write the updated content back to the file
fs.writeFileSync(filePath, htmlContent, 'utf-8');

console.log('✓ Successfully added scroll-to-top button to INDEX.HTML');
console.log('\nAdded features:');
console.log('  ✓ CSS: .scroll-top-btn class with bounceArrow animation');
console.log('  ✓ HTML: Floating button with SVG arrow icon');
console.log('  ✓ JavaScript: Show/hide on scroll (> 300px), smooth scroll to top, ripple effect');
console.log('\nButton specifications:');
console.log('  • Desktop: 50x50px circular button at bottom-right (30px from edges)');
console.log('  • Mobile: 45x45px circular button (responsive)');
console.log('  • Background: Blue gradient (#3b82f6 to #2563eb)');
console.log('  • Animation: Arrow bounces up and down continuously');
console.log('  • Visibility: Only shows when page scrolled > 300px');
console.log('  • Behavior: Smooth fade-in/out animations');
console.log('\nFile updated: INDEX.HTML');
