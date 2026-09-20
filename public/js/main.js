// ============ HERO SLIDER ============
let currentSlide = 0;
let slideInterval;

function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    
    if (slides.length === 0) return;
    
    function showSlide(index) {
        const slidesContainer = document.querySelector('.hero-slides');
        if (!slidesContainer) return;
        
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        
        currentSlide = index;
        slidesContainer.style.transform = `translateX(-${index * 100}%)`;
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
    
    const leftArrow = document.querySelector('.hero-arrow-left');
    const rightArrow = document.querySelector('.hero-arrow-right');
    
    if (leftArrow) {
        leftArrow.addEventListener('click', function(e) {
            e.preventDefault();
            showSlide(currentSlide - 1);
            resetInterval();
        });
    }
    
    if (rightArrow) {
        rightArrow.addEventListener('click', function(e) {
            e.preventDefault();
            showSlide(currentSlide + 1);
            resetInterval();
        });
    }
    
    dots.forEach((dot, i) => {
        dot.addEventListener('click', function() {
            showSlide(i);
            resetInterval();
        });
    });
    
    function startInterval() {
        slideInterval = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 5000);
    }
    
    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }
    
    let touchStartX = 0;
    const slider = document.querySelector('.hero-slider');
    if (slider) {
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        slider.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) {
                showSlide(currentSlide + 1);
                resetInterval();
            } else if (touchEndX - touchStartX > 50) {
                showSlide(currentSlide - 1);
                resetInterval();
            }
        });
    }
    
    showSlide(0);
    startInterval();
}

// ============ AUTO-SLIDING PRODUCT SLIDERS ============
function initProductSliders() {
    const wrappers = document.querySelectorAll('.products-slider-wrapper');
    
    wrappers.forEach(wrapper => {
        const slider = wrapper.querySelector('.products-slider');
        const leftBtn = wrapper.querySelector('.slider-nav-left');
        const rightBtn = wrapper.querySelector('.slider-nav-right');
        
        if (!slider) return;
        
        const scrollAmount = 300;
        let autoSlideTimer;
        let userInteracting = false;
        
        function scrollLeft() {
            slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
        
        function scrollRight() {
            const atEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10;
            
            if (atEnd) {
                slider.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
        
        if (leftBtn) {
            leftBtn.addEventListener('click', function(e) {
                e.preventDefault();
                scrollLeft();
                resetAutoSlide();
            });
        }
        
        if (rightBtn) {
            rightBtn.addEventListener('click', function(e) {
                e.preventDefault();
                scrollRight();
                resetAutoSlide();
            });
        }
        
        function startAutoSlide() {
            autoSlideTimer = setInterval(() => {
                if (!userInteracting) {
                    scrollRight();
                }
            }, 3000);
        }
        
        function resetAutoSlide() {
            clearInterval(autoSlideTimer);
            startAutoSlide();
        }
        
        slider.addEventListener('mouseenter', () => {
            userInteracting = true;
        });
        
        slider.addEventListener('mouseleave', () => {
            userInteracting = false;
        });
        
        slider.addEventListener('touchstart', () => {
            userInteracting = true;
        });
        
        slider.addEventListener('touchend', () => {
            setTimeout(() => { userInteracting = false; }, 3000);
        });
        
        startAutoSlide();
    });
}

// ============ BACK TO TOP ============
window.addEventListener('scroll', function() {
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        if (window.scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    }
});

// ============ SCROLL ANIMATIONS (3D FADE IN) ============
function initScrollAnimations() {
    // Elements to animate on scroll
    const animatedElements = document.querySelectorAll(
        '.category-tile, .product-card-slide, .subcat-section, .trust-badge'
    );
    
    if (animatedElements.length === 0) return;
    
    // IntersectionObserver — checks when element enters viewport
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                // Add delay for staggered effect
                const index = Array.from(entry.target.parentElement.children).indexOf(entry.target);
                const delay = Math.min(index * 100, 500); // Max 500ms delay
                
                setTimeout(function() {
                    entry.target.classList.add('animate-in');
                }, delay);
                
                // Stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,      // Trigger when 15% of element is visible
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before fully visible
    });
    
    // Observe each element
    animatedElements.forEach(function(el) {
        observer.observe(el);
    });
}

// ============ INIT ALL ============
document.addEventListener('DOMContentLoaded', function() {
    initHeroSlider();
    initProductSliders();
    initScrollAnimations();
    
    // Newsletter alert
    const newsletterAlert = document.getElementById('newsletterAlert');
    if (newsletterAlert) {
        setTimeout(function() {
            newsletterAlert.style.transition = 'opacity 0.5s';
            newsletterAlert.style.opacity = '0';
            setTimeout(function() {
                newsletterAlert.remove();
            }, 500);
        }, 3000);
    }
});