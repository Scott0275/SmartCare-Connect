/* ===========================
   SMARTCARE LANDING PAGE
   JavaScript Interactivity
   =========================== */

(function() {
    'use strict';

    const app = {
        // Configuration
        config: {
            emailServiceUrl: 'https://zon8maijih.execute-api.us-east-1.amazonaws.com/prod', // Amplify API Gateway endpoint
            form: null,
            mobileMenuBtn: null,
            navbar: null,
        },

        // Initialize the app
        init() {
            this.cacheElements();
            this.setupEventListeners();
            this.injectStylesheet();
        },

        // Cache DOM elements
        cacheElements() {
            this.config.form = document.querySelector('.email-form');
            this.config.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            this.config.navbar = document.querySelector('.navbar');
        },

        // Setup event listeners
        setupEventListeners() {
            // Mobile menu toggle
            if (this.config.mobileMenuBtn) {
                this.config.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
            }

            // Email form submission
            if (this.config.form) {
                this.config.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
            }

            // Smooth scroll navigation
            document.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', (e) => this.handleSmoothScroll(e));
            });

            // Navbar scroll effect
            window.addEventListener('scroll', () => this.handleNavbarScroll());

            // Analytics tracking for CTAs
            document.querySelectorAll('.btn-primary').forEach(btn => {
                btn.addEventListener('click', () => this.trackEvent('cta_click', {
                    text: btn.textContent.trim(),
                    location: btn.closest('section')?.id || 'unknown'
                }));
            });
        },

        /**
         * Toggle mobile menu visibility
         */
        toggleMobileMenu() {
            const navLinks = document.querySelector('.nav-links');
            const isOpen = navLinks.style.display === 'flex';
            
            navLinks.style.display = isOpen ? 'none' : 'flex';
            this.config.mobileMenuBtn.setAttribute('aria-expanded', !isOpen);

            // Update button animation
            const spans = this.config.mobileMenuBtn.querySelectorAll('span');
            if (!isOpen) {
                spans[0].style.transform = 'rotate(45deg) translate(10px, 10px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        },

        /**
         * Handle email form submission
         */
        async handleFormSubmit(e) {
            e.preventDefault();

            const form = e.target;
            const emailInput = form.querySelector('input[type="email"]');
            const submitBtn = form.querySelector('button[type="submit"]');
            const feedbackEl = form.querySelector('.form-feedback');
            const email = emailInput.value.trim();

            // Client-side validation
            if (!this.validateEmail(email)) {
                this.showFormFeedback(feedbackEl, '❌ Please enter a valid email address', 'error');
                this.trackEvent('form_error', { type: 'invalid_email' });
                return;
            }

            // Disable button during submission
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Subscribing...';
            feedbackEl.textContent = '';

            try {
                // Submit to backend
                const response = await fetch(this.config.emailServiceUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });

                const data = await response.json();

                if (response.ok) {
                    this.showFormFeedback(feedbackEl, '✓ Check your email for early access!', 'success');
                    form.reset();
                    emailInput.focus();
                    this.trackEvent('form_submit_success', { email: this.hashEmail(email) });
                } else if (response.status === 409) {
                    // Duplicate email
                    this.showFormFeedback(
                        feedbackEl,
                        '⚠️ This email is already registered. Check your inbox for details.',
                        'error'
                    );
                    this.trackEvent('form_error', { type: 'duplicate_email' });
                } else if (response.status === 400) {
                    // Invalid email
                    this.showFormFeedback(
                        feedbackEl,
                        '❌ Invalid email format. Please try again.',
                        'error'
                    );
                    this.trackEvent('form_error', { type: 'invalid_format' });
                } else {
                    throw new Error(`Server returned ${response.status}: ${data.message}`);
                }
            } catch (error) {
                console.error('Form submission error:', error);
                this.showFormFeedback(
                    feedbackEl,
                    '❌ Something went wrong. Please try again or contact us.',
                    'error'
                );
                this.trackEvent('form_submit_error', { error: error.message });
            } finally {
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        },

        /**
         * Show form feedback message
         */
        showFormFeedback(element, message, type) {
            if (!element) return;

            element.textContent = message;
            element.classList.remove('success', 'error');
            element.classList.add(type);

            // Auto-clear success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    element.textContent = '';
                    element.classList.remove('success');
                }, 5000);
            }
        },

        /**
         * Validate email format
         */
        validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        /**
         * Hash email for analytics (privacy-conscious)
         */
        hashEmail(email) {
            // Simple hash for analytics - not cryptographically secure
            let hash = 0;
            for (let i = 0; i < email.length; i++) {
                const char = email.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash).toString(36);
        },

        /**
         * Handle smooth scroll navigation
         */
        handleSmoothScroll(e) {
            const href = e.currentTarget.getAttribute('href');
            
            // Only handle internal anchor links
            if (!href.startsWith('#')) return;

            e.preventDefault();

            const target = document.querySelector(href);
            if (!target) return;

            // Close mobile menu if open
            const navLinks = document.querySelector('.nav-links');
            if (navLinks && navLinks.style.display === 'flex') {
                this.toggleMobileMenu();
            }

            // Scroll to target with offset for sticky navbar
            const navbarHeight = this.config.navbar?.offsetHeight || 0;
            const targetPosition = target.offsetTop - navbarHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth',
            });

            // Track scroll event
            this.trackEvent('smooth_scroll', { target: href });
        },

        /**
         * Handle navbar scroll effect
         */
        handleNavbarScroll() {
            if (!this.config.navbar) return;

            const scrollPosition = window.scrollY;
            const shouldHaveShadow = scrollPosition > 10;

            if (shouldHaveShadow) {
                this.config.navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            } else {
                this.config.navbar.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }
        },

        /**
         * Inject styles for JavaScript-dependent features
         */
        injectStylesheet() {
            // Add transition for smooth animations
            const style = document.createElement('style');
            style.textContent = `
                .nav-links {
                    transition: display 0.3s ease-in-out;
                }
                
                .mobile-menu-btn span {
                    transition: all 0.3s ease-in-out;
                }
                
                button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `;
            document.head.appendChild(style);
        },

        /**
         * Track analytics events
         * Replace with your analytics service (Google Analytics, Segment, etc.)
         */
        trackEvent(eventName, data = {}) {
            // Google Analytics example (if available)
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, data);
            }

            // Fallback: Log to console in development
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[Analytics] ${eventName}:`, data);
            }

            // Send to your own analytics endpoint
            this.sendAnalytics(eventName, data);
        },

        /**
         * Send analytics to backend
         */
        async sendAnalytics(eventName, data) {
            try {
                // Optional: Send analytics to your backend
                // await fetch('/api/analytics', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({
                //         event: eventName,
                //         data,
                //         timestamp: new Date().toISOString(),
                //     }),
                // });
            } catch (error) {
                console.error('Analytics send error:', error);
            }
        },

        /**
         * Intersection Observer for fade-in animations
         */
        setupIntersectionObserver() {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('fade-in');
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.1 }
            );

            // Observe all sections
            document.querySelectorAll('section').forEach((section) => {
                observer.observe(section);
            });
        },
    };

    // Initialize app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            app.init();
            app.setupIntersectionObserver();
        });
    } else {
        app.init();
        app.setupIntersectionObserver();
    }

    // Export for testing/debugging
    window.SmartCareLanding = app;

})();
