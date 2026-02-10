$filePath = "c:\Users\Arjun tak\OneDrive\Desktop\MY websites\my-portfolio\INDEX.HTML"

# Read the file
$content = Get-Content $filePath -Raw

# Add CSS for button
$cssToAdd = @"

        /* ===== FLOATING SCROLL TO TOP BUTTON ===== */
        .scroll-top-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            border: 2px solid rgba(255, 255, 255, 0.1);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px);
            transition: all 0.3s ease;
            z-index: 999;
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
            backdrop-filter: blur(10px);
        }

        .scroll-top-btn:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(59, 130, 246, 0.5);
            background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
        }

        .scroll-top-btn:active {
            transform: translateY(-2px);
        }

        .scroll-top-btn.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .scroll-top-btn .arrow-icon {
            width: 24px;
            height: 24px;
            animation: bounceArrow 1.5s ease-in-out infinite;
        }

        @keyframes bounceArrow {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-6px);
            }
        }

        @media (max-width: 767px) {
            .scroll-top-btn {
                bottom: 20px;
                right: 20px;
                width: 45px;
                height: 45px;
            }

            .scroll-top-btn .arrow-icon {
                width: 20px;
                height: 20px;
            }
        }
"@

# Find insertion point and add CSS
$content = $content -replace '(.blur-bg \{[\s\S]*?filter: blur\(6px\);[\s\S]*?\})', "`$1$cssToAdd"

# Add JavaScript and HTML button
$jsAndButton = @'

        // Show/hide scroll to top button
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        });

        // Scroll to top functionality
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
'@

# Replace the end script section
$content = $content -replace '(<!-- Image parallax on scroll -->\s*window\.addEventListener.*?\}\);)\s*</script>', "`$1$jsAndButton`n    </script>"

# Add button before closing body tag
$buttonHtml = @'

    <!-- Floating Scroll To Top Button -->
    <button id="scrollTopBtn" class="scroll-top-btn" title="Scroll to top">
        <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
    </button>
'@

$content = $content -replace '</body>', "$buttonHtml`n</body>"

# Write back to file
Set-Content $filePath $content
Write-Host "File updated successfully!"
