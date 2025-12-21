/* ===========================
   SMARTCARE LANDING PAGE
   JavaScript Interactivity
   =========================== */

(function() {
    'use strict';

    const app = {
        // Configuration
        config: {
            emailServiceUrl: process.env.REACT_APP_API_ENDPOINT || 'https://zon8maijah.execute-api.us-east-1.amazonaws.com/prod', // Amplify API Gateway endpoint
            form: null,
            demoForm: null,
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
            this.config.demoForm = document.querySelector('#demoForm');
            this.config.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            this.config.navbar = document.querySelector('.navbar');
        },

        // Setup event listeners
        setupEventListeners() {
            // Mobile menu toggle
            if (this.config.mobileMenuBtn) {
                this.config.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
            }

            // Email form submission (index.html)
            if (this.config.form) {
                this.config.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
            }

            // Demo booking form submission (book.html)
            if (this.config.demoForm) {
                this.config.demoForm.addEventListener('submit', (e) => this.handleDemoFormSubmit(e));
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
                    body: JSON.stringify({ 
                        type: 'newsletter',
                        email 
                    }),
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

            // Make success messages more prominent
            if (type === 'success') {
                element.style.display = 'block';
                element.style.padding = '16px 20px';
                element.style.borderRadius = '8px';
                element.style.backgroundColor = '#d4edda';
                element.style.color = '#155724';
                element.style.border = '1px solid #c3e6cb';
                element.style.marginTop = '12px';
                element.style.fontWeight = '500';
                element.style.fontSize = '16px';
                
                // Auto-clear success messages after 8 seconds
                setTimeout(() => {
                    element.textContent = '';
                    element.classList.remove('success');
                    element.style.display = 'none';
                }, 8000);
            } else {
                element.style.display = 'block';
                element.style.padding = '16px 20px';
                element.style.borderRadius = '8px';
                element.style.backgroundColor = '#f8d7da';
                element.style.color = '#721c24';
                element.style.border = '1px solid #f5c6cb';
                element.style.marginTop = '12px';
                element.style.fontWeight = '500';
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
         * Handle demo booking form submission
         */
        async handleDemoFormSubmit(e) {
            e.preventDefault();

            const form = e.target;
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            const formData = new FormData(form);

            // Gather form data
            const demoData = {
                fullName: formData.get('fullName'),
                title: formData.get('title'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                hospitalName: formData.get('hospitalName'),
                hospitalState: formData.get('hospitalState'),
                bedCount: formData.get('bedCount'),
                departments: formData.getAll('departments'),
                challenges: formData.getAll('challenges'),
                demoTime: formData.get('demoTime'),
                attendees: formData.get('attendees'),
                additionalInfo: formData.get('additionalInfo'),
                timestamp: new Date().toISOString(),
            };

            // Validate essential fields
            if (!demoData.email || !demoData.fullName || !demoData.hospitalName) {
                const feedbackEl = form.querySelector('.form-feedback') || document.createElement('div');
                this.showFormFeedback(
                    feedbackEl,
                    '❌ Please fill in all required fields.',
                    'error'
                );
                this.trackEvent('demo_form_error', { type: 'missing_fields' });
                return;
            }

            // Disable button during submission
            submitBtn.disabled = true;
            submitBtn.textContent = 'Scheduling...';

            try {
                // Submit to backend
                const response = await fetch(this.config.emailServiceUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'demo_booking',
                        ...demoData,
                    }),
                });

                if (response.ok) {
                    const feedbackEl = form.querySelector('.form-note') || document.createElement('div');
                    this.showFormFeedback(
                        feedbackEl,
                        '✓ Thank you! Your demo has been scheduled.\nWe\'ll contact you within 24 hours to confirm.',
                        'success'
                    );
                    form.reset();
                    this.trackEvent('demo_form_submit_success', { email: this.hashEmail(demoData.email) });
                    
                    // Scroll to confirmation message
                    setTimeout(() => {
                        feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                } else {
                    throw new Error(`Server returned ${response.status}`);
                }
            } catch (error) {
                console.error('Demo form submission error:', error);
                const feedbackEl = form.querySelector('.form-note') || document.createElement('div');
                this.showFormFeedback(
                    feedbackEl,
                    '❌ Something went wrong. Please try again or contact us.',
                    'error'
                );
                this.trackEvent('demo_form_submit_error', { error: error.message });
            } finally {
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
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
