// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Login form handling with authentication
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username && password) {
            // Show loading state
            const submitBtn = this.querySelector('.btn-login-submit');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Signing in...</span>';
            submitBtn.disabled = true;
            
            // Use auth.js login function with API
            login(username, password).then(result => {
                if (result.success) {
                    // Redirect based on role
                    if (result.user.role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'user-dashboard.html';
                    }
                } else {
                    alert(result.message || 'Invalid username or password');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }).catch(error => {
                alert('Login failed: ' + error.message);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        }
    });
}

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

if (navbar) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        }
        
        lastScroll = currentScroll;
    });
}

// Enhanced scroll animations with Intersection Observer
if ('IntersectionObserver' in window) {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all animated elements on page load
    document.addEventListener('DOMContentLoaded', () => {
        const animatedElements = document.querySelectorAll('.card-animate, .service-animate, .about-animate');
        animatedElements.forEach(el => {
            if (!el.classList.contains('visible')) {
                observer.observe(el);
            }
        });
    });
}

// Parallax effect for hero background shapes
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const scrolled = window.pageYOffset;
            const hero = document.querySelector('.hero');
            if (hero) {
                const heroShapes = hero.querySelectorAll('.floating-shape');
                heroShapes.forEach((shape, index) => {
                    const speed = 0.3 + (index * 0.1);
                    const currentTransform = shape.style.transform || '';
                    const baseTransform = currentTransform.replace(/translateY\([^)]*\)/g, '').trim();
                    shape.style.transform = `${baseTransform} translateY(${scrolled * speed}px)`;
                });
            }
            ticking = false;
        });
        ticking = true;
    }
});

