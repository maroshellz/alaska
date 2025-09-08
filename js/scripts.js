// Wedding Invitation Site JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all functionality
    initSmoothScrolling();
    initScrollAnimations();
    initCountdownTimer();
    initRSVPForm();
    initNavigationEffects();
    initStoryAnimations();
    
    // Smooth scrolling for navigation links
    function initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    // Enhanced scroll animations
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible', 'animate');
                    
                    // Stagger animations for multiple elements
                    if (entry.target.classList.contains('gallery-item') || 
                        entry.target.classList.contains('event-card')) {
                        const siblings = Array.from(entry.target.parentNode.children);
                        const index = siblings.indexOf(entry.target);
                        setTimeout(() => {
                            entry.target.classList.add('animate');
                        }, index * 100);
                    }
                }
            });
        }, observerOptions);

        // Observe all elements that need animation
        document.querySelectorAll('.fade-in, .section-title, .gallery-item, .event-card, .countdown-content, .rsvp-form').forEach(el => {
            observer.observe(el);
        });
        
        // Observe timeline items with staggered animation
        document.querySelectorAll('.timeline-item').forEach((el, index) => {
            observer.observe(el);
            el.style.animationDelay = `${index * 0.2}s`;
        });
    }
    
    // Countdown Timer
    function initCountdownTimer() {
        function updateCountdown() {
            const weddingDate = new Date('December 20, 2025 16:00:00').getTime();
            const now = new Date().getTime();
            const timeLeft = weddingDate - now;

            if (timeLeft > 0) {
                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

                // Update with animation
                updateCountdownNumber('days', days);
                updateCountdownNumber('hours', hours);
                updateCountdownNumber('minutes', minutes);
                updateCountdownNumber('seconds', seconds);
            } else {
                // Wedding day has arrived!
                document.getElementById('days').textContent = '00';
                document.getElementById('hours').textContent = '00';
                document.getElementById('minutes').textContent = '00';
                document.getElementById('seconds').textContent = '00';
                
                // Update countdown title
                const countdownTitle = document.querySelector('.countdown-title');
                if (countdownTitle) {
                    countdownTitle.textContent = "Today's the Day!";
                }
            }
        }

        // Update countdown every second
        setInterval(updateCountdown, 1000);
        updateCountdown(); // Initial call
    }
    
    // Enhanced countdown number update with animation
    function updateCountdownNumber(id, newValue) {
        const element = document.getElementById(id);
        const currentValue = parseInt(element.textContent) || 0;
        
        if (currentValue !== newValue) {
            element.classList.add('updating');
            element.textContent = newValue.toString().padStart(2, '0');
            
            setTimeout(() => {
                element.classList.remove('updating');
            }, 500);
        }
    }
    
    // RSVP Form Handling
    function initRSVPForm() {
        const rsvpForm = document.querySelector('.rsvp-form');
        
        if (rsvpForm) {
            rsvpForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // Get form data
                const formData = new FormData(this);
                const name = formData.get('name');
                const email = formData.get('email');
                const attendance = formData.get('attendance');
                const phone = formData.get('phone');
                const message = formData.get('message');
                
                // Validate required fields
                if (!name || !email || !attendance) {
                    showNotification('Please fill in all required fields.', 'error');
                    return;
                }
                
                // Show loading notification
                showNotification('Sending RSVP...', 'info');
                
                try {
                    // Check if Firebase is available
                    if (!window.db || !window.addDoc || !window.collection || !window.serverTimestamp) {
                        throw new Error('Firebase not initialized. Please check your configuration.');
                    }
                    
                    // Prepare RSVP data
                    const rsvpData = {
                        name: name.trim(),
                        email: email.trim(),
                        attendance: attendance === '1', // Convert to boolean
                        phone: phone ? phone.trim() : '',
                        message: message ? message.trim() : '',
                        submittedAt: window.serverTimestamp(),
                        ipAddress: await getClientIP(), // Optional: get user's IP
                        userAgent: navigator.userAgent
                    };
                    
                    // Submit to Firestore
                    const docRef = await window.addDoc(window.collection(window.db, 'rsvps'), rsvpData);
                    
                    // Reset form
                    this.reset();
                    
                    // Show success modal
                    showRSVPSuccessModal();
                    
                    // Log success
                    console.log('RSVP submitted successfully with ID: ', docRef.id);
                    
                } catch (error) {
                    console.error('Error submitting RSVP:', error);
                    showNotification('Sorry, there was an error submitting your RSVP. Please try again or contact us directly.', 'error');
                }
            });
        }
    }
    
    // Helper function to get client IP (optional)
    async function getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.log('Could not get IP address:', error);
            return 'unknown';
        }
    }
    
    // Function to show RSVP success modal
    function showRSVPSuccessModal() {
        const modal = new bootstrap.Modal(document.getElementById('rsvpSuccessModal'));
        modal.show();
        
        // Add some celebration effects
        setTimeout(() => {
            createConfettiEffect();
        }, 500);
    }
    
    // Function to create confetti effect
    function createConfettiEffect() {
        const colors = ['#ffd700', '#3b82f6', '#8b5a3c', '#28a745'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
            }, i * 20);
        }
    }
    
    // Function to create individual confetti pieces
    function createConfettiPiece(color) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${color};
            top: -10px;
            left: ${Math.random() * 100}vw;
            z-index: 10000;
            pointer-events: none;
            border-radius: 50%;
            animation: confettiFall 3s linear forwards;
        `;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
    
    // Navigation effects
    function initNavigationEffects() {
        const navbar = document.querySelector('.custom-nav');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(255,255,255,0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
            } else {
                navbar.style.background = 'rgba(255,255,255,0.95)';
                navbar.style.boxShadow = 'none';
            }
        });
        
        // Active navigation highlighting
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                if (window.scrollY >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }
    
    // Story timeline animations
    function initStoryAnimations() {
        const storyItems = document.querySelectorAll('.timeline-item');
        storyItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.2}s`;
        });
    }
    
    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    // Enhanced parallax effects
    function initParallaxEffect() {
        const heroSection = document.querySelector('.hero-section');
        const heroContent = document.querySelector('.hero-content');
        const floralDecorations = document.querySelectorAll('.floral-decoration');
        
        if (heroSection) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.3;
                const contentRate = scrolled * 0.1;
                
                // Parallax background
                heroSection.style.transform = `translateY(${rate}px)`;
                
                // Parallax content
                if (heroContent) {
                    heroContent.style.transform = `translateY(${contentRate}px)`;
                }
                
                // Parallax floral decorations
                floralDecorations.forEach((decoration, index) => {
                    const decorationRate = scrolled * (0.1 + index * 0.05);
                    decoration.style.transform = `translateY(${decorationRate}px) rotate(${scrolled * 0.1}deg)`;
                });
            });
        }
    }
    
    // Initialize parallax effect
    initParallaxEffect();
    
    // Image lazy loading
    function initLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Initialize lazy loading
    initLazyLoading();
    
    // Mobile menu improvements
    function initMobileMenu() {
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');
        
        if (navbarToggler && navbarCollapse) {
            // Close mobile menu when clicking on a link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (navbarCollapse.classList.contains('show')) {
                        navbarToggler.click();
                    }
                });
            });
        }
    }
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Add loading animation
    function initLoadingAnimation() {
        window.addEventListener('load', () => {
            document.body.classList.add('loaded');
        });
    }
    
    // Initialize loading animation
    initLoadingAnimation();
    
    // Form validation enhancements
    function initFormValidation() {
        const inputs = document.querySelectorAll('.form-control, .form-select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
        
        function validateField(e) {
            const field = e.target;
            const value = field.value.trim();
            
            // Remove existing error styling
            field.classList.remove('is-invalid');
            
            // Validate based on field type
            if (field.hasAttribute('required') && !value) {
                showFieldError(field, 'This field is required');
                return false;
            }
            
            if (field.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    showFieldError(field, 'Please enter a valid email address');
                    return false;
                }
            }
            
            if (field.type === 'tel' && value) {
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                    showFieldError(field, 'Please enter a valid phone number');
                    return false;
                }
            }
            
            return true;
        }
        
        function showFieldError(field, message) {
            field.classList.add('is-invalid');
            
            // Remove existing error message
            const existingError = field.parentNode.querySelector('.invalid-feedback');
            if (existingError) {
                existingError.remove();
            }
            
            // Add error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            errorDiv.textContent = message;
            field.parentNode.appendChild(errorDiv);
        }
        
        function clearFieldError(e) {
            const field = e.target;
            field.classList.remove('is-invalid');
            const errorMessage = field.parentNode.querySelector('.invalid-feedback');
            if (errorMessage) {
                errorMessage.remove();
            }
        }
    }
    
    // Initialize form validation
    initFormValidation();
    
    // Add some fun interactions
    function initFunInteractions() {
        // Add heart animation on click
        document.addEventListener('click', function(e) {
            if (e.target.closest('.hero-content, .section-title')) {
                createHeartAnimation(e.clientX, e.clientY);
            }
        });
        
        function createHeartAnimation(x, y) {
            const heart = document.createElement('div');
            heart.innerHTML = '💕';
            heart.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                font-size: 20px;
                pointer-events: none;
                z-index: 9999;
                animation: heartFloat 2s ease-out forwards;
            `;
            
            document.body.appendChild(heart);
            
            setTimeout(() => {
                heart.remove();
            }, 2000);
        }
        
        // Add CSS for heart animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes heartFloat {
                0% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100px) scale(0.5);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize fun interactions
    initFunInteractions();
    
    // Initialize gallery lightbox
    initGalleryLightbox();
    
    // Initialize enhanced scroll indicator
    initScrollIndicator();
    
    console.log('Wedding invitation site initialized successfully! 💕');
});

// Enhanced Scroll Indicator
function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    if (scrollIndicator) {
        // Make scroll indicator clickable
        scrollIndicator.addEventListener('click', () => {
            const aboutSection = document.querySelector('#about');
            if (aboutSection) {
                aboutSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
        
        // Hide scroll indicator when scrolled
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.transform = 'translateX(-50%) translateY(20px)';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.transform = 'translateX(-50%) translateY(0)';
            }
        });
    }
}

// Gallery Lightbox Functionality
function initGalleryLightbox() {
    const galleryModal = document.getElementById('galleryModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('galleryModalLabel');
    
    if (galleryModal && modalImage && modalTitle) {
        galleryModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget; // Button that triggered the modal
            const imageSrc = button.getAttribute('data-image');
            const imageAlt = button.getAttribute('data-alt');
            
            // Update modal content
            modalImage.src = imageSrc;
            modalImage.alt = imageAlt;
            modalTitle.textContent = imageAlt;
        });
    }
}
