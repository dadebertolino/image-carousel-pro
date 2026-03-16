(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.icp-carousel').forEach(initCarousel);
    });

    function initCarousel(carousel) {
        const track = carousel.querySelector('.icp-carousel-track');
        const dots = Array.from(carousel.querySelectorAll('.icp-dot'));
        const prevBtn = carousel.querySelector('.icp-nav-prev');
        const nextBtn = carousel.querySelector('.icp-nav-next');
        
        let slides = Array.from(track.querySelectorAll('.icp-carousel-slide'));
        if (slides.length === 0) return;
        
        const interval = parseInt(carousel.dataset.interval) || 3000;
        const transition = parseInt(carousel.dataset.transition) || 500;
        const zoom = parseFloat(carousel.dataset.zoom) || 1.3;
        // data-total contiene il conteggio reale (senza slide duplicate per il padding)
        const totalSlides = parseInt(carousel.dataset.total) || slides.length;
        
        carousel.style.setProperty('--icp-transition', transition + 'ms');
        carousel.style.setProperty('--icp-zoom', zoom);
        
        // Sposta le ultime 2 slide all'inizio per avere slide visibili a sinistra
        const lastSlide = track.lastElementChild;
        track.insertBefore(lastSlide, track.firstElementChild);
        const secondLastSlide = track.lastElementChild;
        track.insertBefore(secondLastSlide, track.firstElementChild);
        
        let currentIndex = 0;
        let autoplayTimer = null;
        let isTransitioning = false;
        
        function getMetrics() {
            const slide = track.querySelector('.icp-carousel-slide');
            const slideWidth = slide.offsetWidth;
            const gap = parseInt(window.getComputedStyle(track).gap) || 20;
            return { slideWidth, gap };
        }
        
        function setInitialPosition() {
            const { slideWidth, gap } = getMetrics();
            const containerWidth = carousel.offsetWidth;
            // Centra la terza slide (index 2)
            const offset = (containerWidth / 2) - (2 * slideWidth) - (2 * gap) - (slideWidth / 2);
            track.style.transform = `translateX(${offset}px)`;
        }
        
        function updateActiveStates() {
            slides = Array.from(track.querySelectorAll('.icp-carousel-slide'));
            slides.forEach((slide, index) => {
                slide.classList.toggle('icp-active', index === 2);
            });
            
            dots.forEach((dot, index) => {
                dot.classList.toggle('icp-active', index === currentIndex);
            });
        }
        
        function next() {
            if (isTransitioning) return;
            isTransitioning = true;
            
            const { slideWidth, gap } = getMetrics();
            const currentTransform = new DOMMatrix(getComputedStyle(track).transform).m41;
            
            track.style.transition = `transform ${transition}ms ease`;
            track.style.transform = `translateX(${currentTransform - slideWidth - gap}px)`;
            
            setTimeout(() => {
                track.style.transition = 'none';
                const firstSlide = track.firstElementChild;
                track.appendChild(firstSlide);
                setInitialPosition();
                
                currentIndex = (currentIndex + 1) % totalSlides;
                updateActiveStates();
                isTransitioning = false;
            }, transition);
        }
        
        function prev() {
            if (isTransitioning) return;
            isTransitioning = true;
            
            const { slideWidth, gap } = getMetrics();
            const lastSlide = track.lastElementChild;
            
            track.style.transition = 'none';
            track.insertBefore(lastSlide, track.firstElementChild);
            
            const currentTransform = new DOMMatrix(getComputedStyle(track).transform).m41;
            track.style.transform = `translateX(${currentTransform - slideWidth - gap}px)`;
            
            // Force reflow
            track.offsetHeight;
            
            track.style.transition = `transform ${transition}ms ease`;
            setInitialPosition();
            
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateActiveStates();
            
            setTimeout(() => {
                isTransitioning = false;
            }, transition);
        }
        
        function goTo(targetIndex) {
            if (isTransitioning) return;
            
            const diff = targetIndex - currentIndex;
            if (diff === 0) return;
            
            const steps = Math.abs(diff);
            const direction = diff > 0 ? next : prev;
            
            let i = 0;
            function step() {
                if (i < steps) {
                    direction();
                    i++;
                    setTimeout(step, transition + 50);
                }
            }
            step();
        }
        
        function startAutoplay() {
            stopAutoplay();
            autoplayTimer = setInterval(next, interval);
        }
        
        function stopAutoplay() {
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
        }
        
        // Eventi
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                prev();
                startAutoplay();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                next();
                startAutoplay();
            });
        }
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', function() {
                goTo(index);
                startAutoplay();
            });
        });
        
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);
        
        // Touch
        let touchStartX = 0;
        
        carousel.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoplay();
        }, { passive: true });
        
        carousel.addEventListener('touchend', function(e) {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) {
                diff > 0 ? next() : prev();
            }
            startAutoplay();
        }, { passive: true });
        
        // Keyboard
        carousel.setAttribute('tabindex', '0');
        carousel.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') { prev(); startAutoplay(); }
            if (e.key === 'ArrowRight') { next(); startAutoplay(); }
        });
        
        // Resize
        window.addEventListener('resize', function() {
            if (!isTransitioning) {
                setInitialPosition();
            }
        });
        
        // Init
        setInitialPosition();
        updateActiveStates();
        startAutoplay();
        
        // Lightbox: ID univoco per istanza passato via data attribute
        const lightboxId = carousel.dataset.lightbox;
        const lightbox = lightboxId ? document.getElementById(lightboxId) : null;
        if (lightbox) {
            const lightboxImg = lightbox.querySelector('.icp-lightbox-img');
            const lightboxCaption = lightbox.querySelector('.icp-lightbox-caption');
            const lightboxClose = lightbox.querySelector('.icp-lightbox-close');
            
            track.addEventListener('click', function(e) {
                const slide = e.target.closest('.icp-carousel-slide');
                if (slide) {
                    const fullSrc = slide.dataset.full || slide.querySelector('img').src;
                    const caption = slide.querySelector('.icp-slide-caption');
                    
                    lightboxImg.src = fullSrc;
                    lightboxCaption.textContent = caption ? caption.textContent : '';
                    lightbox.classList.add('icp-lightbox-open');
                    stopAutoplay();
                }
            });
            
            lightboxClose.addEventListener('click', function() {
                lightbox.classList.remove('icp-lightbox-open');
                startAutoplay();
            });
            
            lightbox.addEventListener('click', function(e) {
                if (e.target === lightbox) {
                    lightbox.classList.remove('icp-lightbox-open');
                    startAutoplay();
                }
            });
            
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && lightbox.classList.contains('icp-lightbox-open')) {
                    lightbox.classList.remove('icp-lightbox-open');
                    startAutoplay();
                }
            });
        }
    }
})();
