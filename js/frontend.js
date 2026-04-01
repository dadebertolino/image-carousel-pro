(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.icp-carousel-wrapper, .icp-carousel').forEach(function(el) {
            var carousel = el.classList.contains('icp-carousel') ? el : el.querySelector('.icp-carousel');
            if (!carousel || carousel.dataset.icpInit) return;
            carousel.dataset.icpInit = '1';
            
            // Applica tutte le CSS custom properties
            var noShadow = carousel.dataset.showShadow === '0';
            var props = {
                '--icp-border-color':          carousel.dataset.borderColor,
                '--icp-border-color-inactive':  carousel.dataset.borderColorInactive,
                '--icp-border-width':           carousel.dataset.borderWidth ? carousel.dataset.borderWidth + 'px' : null,
                '--icp-border-radius':          carousel.dataset.borderRadius ? carousel.dataset.borderRadius + 'px' : null,
                '--icp-slide-width':            carousel.dataset.slideWidth ? carousel.dataset.slideWidth + 'px' : null,
                '--icp-slide-height':           carousel.dataset.slideHeight ? carousel.dataset.slideHeight + 'px' : null,
                '--icp-container-height':       carousel.dataset.containerHeight && parseInt(carousel.dataset.containerHeight) > 0 ? carousel.dataset.containerHeight + 'px' : null,
                '--icp-container-border-color':  carousel.dataset.containerBorderColor || null,
                '--icp-container-border-width':  carousel.dataset.containerBorderWidth && parseInt(carousel.dataset.containerBorderWidth) > 0 ? carousel.dataset.containerBorderWidth + 'px' : null,
                '--icp-container-border-radius': carousel.dataset.containerBorderRadius && parseInt(carousel.dataset.containerBorderRadius) > 0 ? carousel.dataset.containerBorderRadius + 'px' : null,
                '--icp-container-padding':       carousel.dataset.containerPadding !== undefined ? carousel.dataset.containerPadding + 'px' : null
            };
            for (var key in props) { if (props[key] !== null && props[key] !== undefined) carousel.style.setProperty(key, props[key]); }
            
            // Ombra: se disabilitata, forza none
            if (noShadow) {
                carousel.style.setProperty('--icp-shadow', 'none');
                carousel.style.setProperty('--icp-shadow-active', 'none');
            }
            
            // Adattamento immagine
            var imageFit = carousel.dataset.imageFit;
            if (imageFit) {
                carousel.style.setProperty('--icp-image-fit', imageFit);
            }
            
            // Ken Burns
            if (carousel.dataset.kenBurns === '1') {
                carousel.classList.add('icp-ken-burns');
                var kbInterval = parseInt(carousel.dataset.interval) || 3000;
                carousel.style.setProperty('--icp-interval', kbInterval + 'ms');
            }
            
            // Parallax
            if (carousel.dataset.parallax === '1') {
                carousel.classList.add('icp-parallax');
                initParallax(carousel);
            }
            
            // 3D Tilt
            if (carousel.dataset.tilt3d === '1') {
                carousel.classList.add('icp-tilt-3d');
                initTilt3d(carousel);
            }
            
            var mode = carousel.dataset.mode || 'carousel';
            if (mode === 'single') { initSingle(carousel); } else { initCarousel(carousel); }
        });
    });

    // =========================================================
    // MODALITÀ CAROUSEL
    // =========================================================
    function initCarousel(carousel) {
        var wrapper = carousel.closest('.icp-carousel-wrapper') || carousel.parentElement;
        var track = carousel.querySelector('.icp-carousel-track');
        var dotsContainer = carousel.querySelector('.icp-carousel-dots');
        var prevBtn = carousel.querySelector('.icp-nav-prev');
        var nextBtn = carousel.querySelector('.icp-nav-next');
        
        var originalSlides = Array.from(track.querySelectorAll('.icp-carousel-slide')).map(function(s) {
            return { html: s.outerHTML, tags: (s.dataset.tags || '').toLowerCase() };
        });
        if (originalSlides.length === 0) return;
        
        var interval = parseInt(carousel.dataset.interval) || 3000;
        var transition = parseInt(carousel.dataset.transition) || 500;
        var zoom = parseFloat(carousel.dataset.zoom) || 1.3;
        var autoplayVideo = carousel.dataset.autoplayVideo === '1';
        
        carousel.style.setProperty('--icp-transition', transition + 'ms');
        carousel.style.setProperty('--icp-zoom', zoom);
        
        var currentIndex = 0, autoplayTimer = null, isTransitioning = false, totalSlides = 0, dots = [], videoPlaying = false;
        
        function pauseAllVideos() {
            track.querySelectorAll('video.icp-slide-video-el').forEach(function(v) { v.pause(); v.closest('.icp-carousel-slide').classList.remove('icp-video-playing'); });
            videoPlaying = false;
        }
        
        function handleActiveSlideVideo() {
            var all = Array.from(track.querySelectorAll('.icp-carousel-slide'));
            var active = all[2]; if (!active) return;
            pauseAllVideos();
            if (autoplayVideo && active.dataset.type === 'video') {
                var v = active.querySelector('video.icp-slide-video-el');
                if (v) { v.play().catch(function(){}); active.classList.add('icp-video-playing'); videoPlaying = true; stopAutoplay(); }
            }
        }
        
        function toggleVideoPlay(slide) {
            var v = slide.querySelector('video.icp-slide-video-el'); if (!v) return;
            if (v.paused) { pauseAllVideos(); v.play().catch(function(){}); slide.classList.add('icp-video-playing'); videoPlaying = true; stopAutoplay(); }
            else { v.pause(); slide.classList.remove('icp-video-playing'); videoPlaying = false; startAutoplay(); }
        }
        
        function buildCarousel(slideHTMLs) {
            stopAutoplay(); pauseAllVideos(); isTransitioning = false; currentIndex = 0;
            track.innerHTML = slideHTMLs.join('');
            var slidesInTrack = Array.from(track.querySelectorAll('.icp-carousel-slide'));
            totalSlides = slidesInTrack.length;
            if (totalSlides === 0) { dotsContainer.innerHTML = ''; return; }
            if (totalSlides < 3) {
                while (track.querySelectorAll('.icp-carousel-slide').length < 3) {
                    slidesInTrack.forEach(function(s) { if (track.querySelectorAll('.icp-carousel-slide').length >= 3) return; track.appendChild(s.cloneNode(true)); });
                }
            }
            track.insertBefore(track.lastElementChild, track.firstElementChild);
            track.insertBefore(track.lastElementChild, track.firstElementChild);
            dotsContainer.innerHTML = '';
            for (var i = 0; i < totalSlides; i++) {
                var d = document.createElement('button');
                d.className = 'icp-dot' + (i === 0 ? ' icp-active' : ''); d.dataset.index = i;
                d.addEventListener('click', (function(idx) { return function() { goTo(idx); startAutoplay(); }; })(i));
                dotsContainer.appendChild(d);
            }
            dots = Array.from(dotsContainer.querySelectorAll('.icp-dot'));
            track.style.transition = 'none';
            setInitialPosition(); updateActiveStates(); handleActiveSlideVideo(); startAutoplay();
        }
        
        function getMetrics() {
            var s = track.querySelector('.icp-carousel-slide');
            if (!s) return { slideWidth: 250, gap: 20 };
            return { slideWidth: s.offsetWidth, gap: parseInt(window.getComputedStyle(track).gap) || 20 };
        }
        
        function setInitialPosition() {
            var m = getMetrics(), cw = carousel.offsetWidth;
            track.style.transform = 'translateX(' + ((cw / 2) - (2 * m.slideWidth) - (2 * m.gap) - (m.slideWidth / 2)) + 'px)';
        }
        
        function updateActiveStates() {
            Array.from(track.querySelectorAll('.icp-carousel-slide')).forEach(function(s, i) { s.classList.toggle('icp-active', i === 2); });
            dots.forEach(function(d, i) { 
                d.classList.toggle('icp-active', i === currentIndex);
                d.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
            });
            preloadNearby(track, 2, 2);
        }
        
        function next() {
            if (isTransitioning) return; isTransitioning = true; pauseAllVideos();
            var m = getMetrics(), ct = new DOMMatrix(getComputedStyle(track).transform).m41;
            track.style.transition = 'transform ' + transition + 'ms ease';
            track.style.transform = 'translateX(' + (ct - m.slideWidth - m.gap) + 'px)';
            setTimeout(function() {
                track.style.transition = 'none'; track.appendChild(track.firstElementChild); setInitialPosition();
                currentIndex = (currentIndex + 1) % totalSlides; updateActiveStates(); handleActiveSlideVideo(); isTransitioning = false;
            }, transition);
        }
        
        function prev() {
            if (isTransitioning) return; isTransitioning = true; pauseAllVideos();
            var m = getMetrics();
            track.style.transition = 'none'; track.insertBefore(track.lastElementChild, track.firstElementChild);
            var ct = new DOMMatrix(getComputedStyle(track).transform).m41;
            track.style.transform = 'translateX(' + (ct - m.slideWidth - m.gap) + 'px)';
            track.offsetHeight;
            track.style.transition = 'transform ' + transition + 'ms ease'; setInitialPosition();
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides; updateActiveStates(); handleActiveSlideVideo();
            setTimeout(function() { isTransitioning = false; }, transition);
        }
        
        function goTo(idx) {
            if (isTransitioning) return;
            var diff = idx - currentIndex; if (diff === 0) return;
            var steps = Math.abs(diff), dir = diff > 0 ? next : prev, i = 0;
            (function step() { if (i < steps) { dir(); i++; setTimeout(step, transition + 50); } })();
        }
        
        function startAutoplay() { if (videoPlaying) return; stopAutoplay(); autoplayTimer = setInterval(next, interval); }
        function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }
        
        var isMinimal = carousel.dataset.minimal === '1';
        
        if (!isMinimal) {
            setupFilters(wrapper, carousel, originalSlides, buildCarousel);
            if (prevBtn) prevBtn.addEventListener('click', function() { prev(); startAutoplay(); });
            if (nextBtn) nextBtn.addEventListener('click', function() { next(); startAutoplay(); });
            carousel.addEventListener('mouseenter', stopAutoplay);
            carousel.addEventListener('mouseleave', function() { if (!videoPlaying) startAutoplay(); });
            setupTouch(carousel, next, prev, startAutoplay, stopAutoplay);
            setupKeyboard(carousel, next, prev, startAutoplay);
        }
        window.addEventListener('resize', function() { if (!isTransitioning) setInitialPosition(); });
        
        buildCarousel(originalSlides.map(function(s) { return s.html; }));
        
        if (!isMinimal) {
            track.addEventListener('click', function(e) {
                var slide = e.target.closest('.icp-carousel-slide'); if (!slide) return;
                if (slide.dataset.type === 'video') { toggleVideoPlay(slide); return; }
                openLightbox(carousel, slide);
            });
            setupLightbox(carousel, startAutoplay);
            setupFullscreen(carousel, track, startAutoplay, stopAutoplay, pauseAllVideos);
        }
    }

    // =========================================================
    // MODALITÀ SINGLE
    // =========================================================
    function initSingle(carousel) {
        var wrapper = carousel.closest('.icp-carousel-wrapper') || carousel.parentElement;
        var track = carousel.querySelector('.icp-carousel-track');
        var dotsContainer = carousel.querySelector('.icp-carousel-dots');
        var prevBtn = carousel.querySelector('.icp-nav-prev');
        var nextBtn = carousel.querySelector('.icp-nav-next');
        
        var slides = Array.from(track.querySelectorAll('.icp-carousel-slide'));
        var originalSlides = slides.map(function(s) { return { html: s.outerHTML, tags: (s.dataset.tags || '').toLowerCase() }; });
        if (slides.length === 0) return;
        
        var interval = parseInt(carousel.dataset.interval) || 3000;
        var transition = parseInt(carousel.dataset.transition) || 500;
        var effect = carousel.dataset.effect || 'fade';
        var autoplayVideo = carousel.dataset.autoplayVideo === '1';
        
        carousel.style.setProperty('--icp-transition', transition + 'ms');
        
        var currentIndex = 0, autoplayTimer = null, isTransitioning = false, totalSlides = slides.length, dots = [], videoPlaying = false;
        
        function pauseAllVideos() {
            track.querySelectorAll('video.icp-slide-video-el').forEach(function(v) { v.pause(); v.closest('.icp-carousel-slide').classList.remove('icp-video-playing'); });
            videoPlaying = false;
        }
        function toggleVideoPlay(slide) {
            var v = slide.querySelector('video.icp-slide-video-el'); if (!v) return;
            if (v.paused) { pauseAllVideos(); v.play().catch(function(){}); slide.classList.add('icp-video-playing'); videoPlaying = true; stopAutoplay(); }
            else { v.pause(); slide.classList.remove('icp-video-playing'); videoPlaying = false; startAutoplay(); }
        }
        
        function initSlides() {
            slides = Array.from(track.querySelectorAll('.icp-carousel-slide'));
            totalSlides = slides.length;
            slides.forEach(function(s) { s.classList.remove('icp-active', 'icp-exit-left', 'icp-exit-flip', 'icp-exit-zoom'); });
            currentIndex = 0;
            if (slides[0]) slides[0].classList.add('icp-active');
            dotsContainer.innerHTML = '';
            for (var i = 0; i < totalSlides; i++) {
                var d = document.createElement('button');
                d.className = 'icp-dot' + (i === 0 ? ' icp-active' : ''); d.dataset.index = i;
                d.addEventListener('click', (function(idx) { return function() { goTo(idx); startAutoplay(); }; })(i));
                dotsContainer.appendChild(d);
            }
            dots = Array.from(dotsContainer.querySelectorAll('.icp-dot'));
            preloadNearby(track, currentIndex, 2);
            handleActiveVideo();
        }
        
        function handleActiveVideo() {
            pauseAllVideos();
            var active = slides[currentIndex];
            if (active && autoplayVideo && active.dataset.type === 'video') {
                var v = active.querySelector('video.icp-slide-video-el');
                if (v) { v.play().catch(function(){}); active.classList.add('icp-video-playing'); videoPlaying = true; stopAutoplay(); }
            }
        }
        
        function transitionTo(newIndex) {
            if (isTransitioning || newIndex === currentIndex) return;
            isTransitioning = true; pauseAllVideos();
            var oldSlide = slides[currentIndex], newSlide = slides[newIndex];
            var exitClass = '';
            if (effect === 'slide') exitClass = 'icp-exit-left';
            else if (effect === 'flip') exitClass = 'icp-exit-flip';
            else if (effect === 'zoom') exitClass = 'icp-exit-zoom';
            if (exitClass) oldSlide.classList.add(exitClass);
            oldSlide.classList.remove('icp-active');
            oldSlide.setAttribute('aria-hidden', 'true');
            newSlide.classList.add('icp-active');
            newSlide.setAttribute('aria-hidden', 'false');
            currentIndex = newIndex;
            dots.forEach(function(d, i) { 
                d.classList.toggle('icp-active', i === currentIndex);
                d.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
            });
            setTimeout(function() { if (exitClass) oldSlide.classList.remove(exitClass); isTransitioning = false; preloadNearby(track, currentIndex, 2); handleActiveVideo(); }, transition);
        }
        
        function next() { transitionTo((currentIndex + 1) % totalSlides); }
        function prev() { transitionTo((currentIndex - 1 + totalSlides) % totalSlides); }
        function goTo(idx) { transitionTo(idx); }
        function startAutoplay() { if (videoPlaying) return; stopAutoplay(); autoplayTimer = setInterval(next, interval); }
        function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }
        
        var isMinimal = carousel.dataset.minimal === '1';
        
        if (!isMinimal) {
            setupFilters(wrapper, carousel, originalSlides, function(htmls) {
                stopAutoplay(); pauseAllVideos(); track.innerHTML = htmls.join(''); initSlides(); startAutoplay();
            });
            if (prevBtn) prevBtn.addEventListener('click', function() { prev(); startAutoplay(); });
            if (nextBtn) nextBtn.addEventListener('click', function() { next(); startAutoplay(); });
            carousel.addEventListener('mouseenter', stopAutoplay);
            carousel.addEventListener('mouseleave', function() { if (!videoPlaying) startAutoplay(); });
            setupTouch(carousel, next, prev, startAutoplay, stopAutoplay);
            setupKeyboard(carousel, next, prev, startAutoplay);
        }
        
        initSlides(); startAutoplay();
        
        if (!isMinimal) {
            track.addEventListener('click', function(e) {
                var slide = e.target.closest('.icp-carousel-slide'); if (!slide) return;
                if (slide.dataset.type === 'video') { toggleVideoPlay(slide); return; }
                openLightbox(carousel, slide);
            });
            setupLightbox(carousel, startAutoplay);
            setupFullscreen(carousel, track, startAutoplay, stopAutoplay, pauseAllVideos);
        }
    }

    // =========================================================
    // SHARED HELPERS
    // =========================================================
    
    /**
     * Parallax: trasla le immagini in base alla posizione di scroll.
     * L'immagine è 120% altezza (via CSS), il JS la muove su/giù.
     */
    function initParallax(carousel) {
        var ticking = false;
        
        function updateParallax() {
            var rect = carousel.getBoundingClientRect();
            var winH = window.innerHeight;
            
            // Calcola quanto il carousel è visibile (-1 a 1)
            var center = rect.top + rect.height / 2;
            var ratio = (center - winH / 2) / (winH / 2);
            ratio = Math.max(-1, Math.min(1, ratio));
            
            // Trasla le immagini (max ±10% dell'extra 20%)
            var offset = ratio * -10;
            
            var media = carousel.querySelectorAll('.icp-carousel-slide img, .icp-carousel-slide .icp-slide-video-el');
            media.forEach(function(el) {
                el.style.transform = 'translateY(' + offset + '%)';
            });
            
            ticking = false;
        }
        
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
        
        // Esegui subito per posizione iniziale
        updateParallax();
    }
    
    /**
     * 3D Tilt: rotazione sottile della slide in base alla posizione del mouse.
     * Max ±8 gradi, reset smooth al mouseleave.
     */
    function initTilt3d(carousel) {
        var maxTilt = 10;
        var track = carousel.querySelector('.icp-carousel-track');
        
        console.log('[ICP] 3D Tilt inizializzato', track);
        
        // Usa event delegation sul carousel (non sul track, che viene ricostruito internamente)
        carousel.addEventListener('mousemove', function(e) {
            var slide = e.target.closest('.icp-carousel-slide');
            if (!slide) return;
            
            var rect = slide.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            
            var x = (e.clientX - rect.left) / rect.width;
            var y = (e.clientY - rect.top) / rect.height;
            
            var rotateY = ((x - 0.5) * maxTilt * 2).toFixed(2);
            var rotateX = ((0.5 - y) * maxTilt * 2).toFixed(2);
            
            // Preserva lo scale della slide attiva
            var isActive = slide.classList.contains('icp-active');
            var zoom = isActive ? (parseFloat(carousel.dataset.zoom) || 1.3) : 1;
            
            slide.style.cssText += '; transform: perspective(600px) scale(' + zoom + ') rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) !important; transition: transform 0.1s ease-out !important;';
        });
        
        function resetSlide(slide) {
            if (!slide) return;
            var isActive = slide.classList.contains('icp-active');
            var zoom = isActive ? (parseFloat(carousel.dataset.zoom) || 1.3) : 1;
            
            if (isActive) {
                slide.style.cssText += '; transform: scale(' + zoom + ') !important; transition: transform 0.4s ease-out !important;';
            } else {
                slide.style.transform = '';
                slide.style.transition = '';
            }
        }
        
        carousel.addEventListener('mouseleave', function() {
            var allSlides = carousel.querySelectorAll('.icp-carousel-slide');
            allSlides.forEach(resetSlide);
        });
    }
    
    /**
     * Preload intelligente + skeleton loading.
     * Carica src delle immagini/video entro ±range dall'attiva.
     * Aggiunge classe icp-skeleton finché l'immagine non è pronta.
     */
    function preloadNearby(track, activeIndex, range) {
        var slides = Array.from(track.querySelectorAll('.icp-carousel-slide'));
        var total = slides.length;
        if (total === 0) return;
        
        // Imposta skeleton su tutte le slide non ancora caricate
        slides.forEach(function(s) {
            if (!s.classList.contains('icp-loaded')) {
                s.classList.add('icp-skeleton');
            }
        });
        
        for (var offset = -range; offset <= range; offset++) {
            var idx = (activeIndex + offset + total) % total;
            var slide = slides[idx];
            if (!slide || slide.classList.contains('icp-loaded')) continue;
            
            // Immagini
            var img = slide.querySelector('img[data-src]');
            if (img && img.getAttribute('data-src')) {
                (function(s, i) {
                    i.onload = function() {
                        s.classList.remove('icp-skeleton');
                        s.classList.add('icp-loaded');
                    };
                    i.src = i.getAttribute('data-src');
                    i.removeAttribute('data-src');
                    // Se già in cache
                    if (i.complete) {
                        s.classList.remove('icp-skeleton');
                        s.classList.add('icp-loaded');
                    }
                })(slide, img);
            }
            
            // Video
            var source = slide.querySelector('video source[data-src]');
            if (source && source.getAttribute('data-src')) {
                source.src = source.getAttribute('data-src');
                source.removeAttribute('data-src');
                var video = source.closest('video');
                if (video) {
                    video.preload = 'metadata';
                    video.load();
                    (function(s, v) {
                        v.addEventListener('loadedmetadata', function() {
                            s.classList.remove('icp-skeleton');
                            s.classList.add('icp-loaded');
                        }, { once: true });
                    })(slide, video);
                }
            }
            
            // Slide senza media (solo caption)
            if (!img && !source) {
                slide.classList.remove('icp-skeleton');
                slide.classList.add('icp-loaded');
            }
        }
    }
    
    function setupFilters(wrapper, carousel, originalSlides, rebuildFn) {
        var bar = wrapper.querySelector('.icp-filter-bar'); if (!bar) return;
        bar.addEventListener('click', function(e) {
            var btn = e.target.closest('.icp-filter-btn'); if (!btn) return;
            bar.querySelectorAll('.icp-filter-btn').forEach(function(b) { 
                b.classList.remove('icp-filter-active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('icp-filter-active');
            btn.setAttribute('aria-pressed', 'true');
            var filter = btn.dataset.filter;
            carousel.classList.add('icp-filtering');
            setTimeout(function() {
                var filtered = filter === '*'
                    ? originalSlides.map(function(s) { return s.html; })
                    : originalSlides.filter(function(s) { return s.tags.split(',').map(function(t) { return t.trim(); }).indexOf(filter) !== -1; }).map(function(s) { return s.html; });
                if (filtered.length > 0) rebuildFn(filtered);
                carousel.classList.remove('icp-filtering');
            }, 350);
        });
    }
    
    function setupTouch(carousel, nextFn, prevFn, startFn, stopFn) {
        var startX = 0;
        carousel.addEventListener('touchstart', function(e) { startX = e.changedTouches[0].screenX; stopFn(); }, { passive: true });
        carousel.addEventListener('touchend', function(e) {
            var diff = startX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) { diff > 0 ? nextFn() : prevFn(); }
            startFn();
        }, { passive: true });
    }
    
    function setupKeyboard(carousel, nextFn, prevFn, startFn) {
        carousel.setAttribute('tabindex', '0');
        carousel.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') { prevFn(); startFn(); }
            if (e.key === 'ArrowRight') { nextFn(); startFn(); }
        });
    }
    
    function openLightbox(carousel, slide) {
        var lbId = carousel.dataset.lightbox;
        var lb = lbId ? document.getElementById(lbId) : null; if (!lb) return;
        lb.querySelector('.icp-lightbox-img').src = slide.dataset.full || slide.querySelector('img').src;
        lb.querySelector('.icp-lightbox-caption').textContent = (slide.querySelector('.icp-slide-caption') || {}).textContent || '';
        lb.classList.add('icp-lightbox-open');
    }
    
    function setupLightbox(carousel, startFn) {
        var lb = document.getElementById(carousel.dataset.lightbox); if (!lb) return;
        function close() { lb.classList.remove('icp-lightbox-open'); startFn(); }
        lb.querySelector('.icp-lightbox-close').addEventListener('click', close);
        lb.addEventListener('click', function(e) { if (e.target === lb) close(); });
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && lb.classList.contains('icp-lightbox-open')) close(); });
    }
    
    function setupFullscreen(carousel, track, startFn, stopFn, pauseFn) {
        var fs = document.getElementById(carousel.dataset.fullscreen); if (!fs) return;
        var img = fs.querySelector('.icp-fullscreen-img'), cap = fs.querySelector('.icp-fullscreen-caption'), close = fs.querySelector('.icp-fullscreen-close');
        var btn = carousel.querySelector('.icp-nav-fullscreen');
        function openFs(src, text) { img.src = src; cap.textContent = text || ''; fs.classList.add('icp-fullscreen-open'); stopFn(); pauseFn(); }
        function closeFs() { fs.classList.remove('icp-fullscreen-open'); startFn(); }
        if (btn) btn.addEventListener('click', function() {
            var a = track.querySelector('.icp-carousel-slide.icp-active');
            if (a && a.dataset.type !== 'video') openFs(a.dataset.full || a.querySelector('img').src, (a.querySelector('.icp-slide-caption') || {}).textContent || '');
        });
        track.addEventListener('dblclick', function(e) {
            var s = e.target.closest('.icp-carousel-slide');
            if (s && s.dataset.type !== 'video') openFs(s.dataset.full || s.querySelector('img').src, (s.querySelector('.icp-slide-caption') || {}).textContent || '');
        });
        close.addEventListener('click', closeFs);
        fs.addEventListener('click', function(e) { if (e.target === fs) closeFs(); });
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && fs.classList.contains('icp-fullscreen-open')) closeFs(); });
    }
})();