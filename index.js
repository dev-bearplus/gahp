const script = () => {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.defaults({
        invalidateOnRefresh: true
    });
    const xGetter = (el) => gsap.getProperty(el, 'x');
    const yGetter = (el) => gsap.getProperty(el, 'y');
    const xSetter = (el) => gsap.quickSetter(el, 'x', `px`);
    const ySetter = (el) => gsap.quickSetter(el, 'y', `px`);

    const cvUnit = (val, unit) => {
        let result;
        switch (true) {
            case unit === 'vw':
                result = window.innerWidth * (val / 100);
                break;
            case unit === 'vh':
                result = window.innerHeight * (val / 100);
                break;
            case unit === 'rem':
                result = val / 10 * parseFloat($('html').css('font-size'));
                break;
            default: break;
        }
        return result;
    }
    const viewport = {
        get w() {
            return window.innerWidth;
        },
        get h() {
            return window.innerHeight;
        },
    }
    const device = { desktop: 991, tablet: 767, mobile: 479 }
    const debounce = (func, timeout = 300) => {
        let timer

        return (...args) => {
            clearTimeout(timer)
            timer = setTimeout(() => { func.apply(this, args) }, timeout)
        }
    }
    const isInViewport = (el, orientation = 'vertical') => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (orientation == 'horizontal') {
            return (
                rect.left <= (window.innerWidth) &&
                rect.right >= 0
            );
        } else {
            return (
                rect.top <= (window.innerHeight) &&
                rect.bottom >= 0
            );
        }
    }
    const refreshOnBreakpoint = () => {
        const breakpoints = Object.values(device).sort((a, b) => a - b);
        const initialViewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const breakpoint = breakpoints.find(bp => initialViewportWidth < bp) || breakpoints[breakpoints.length - 1];
        window.addEventListener('resize', debounce(function () {
            const newViewportWidth = window.innerWidth || document.documentElement.clientWidth;
            if ((initialViewportWidth < breakpoint && newViewportWidth >= breakpoint) ||
                (initialViewportWidth >= breakpoint && newViewportWidth < breakpoint)) {
                location.reload();
            }
        }));
    }
    const documentHeightObserver = (() => {
        let previousHeight = document.documentElement.scrollHeight;
        let resizeObserver;
        let debounceTimer;

        function refreshScrollTrigger() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const currentHeight = document.documentElement.scrollHeight;

                if (currentHeight !== previousHeight) {
                    console.log("Document height changed. Refreshing ScrollTrigger...");
                    ScrollTrigger.refresh();
                    previousHeight = currentHeight;
                }
            }, 200); // Adjust the debounce delay as needed
        }

        return (action) => {
            if (action === "init") {
                console.log("Initializing document height observer...");
                resizeObserver = new ResizeObserver(refreshScrollTrigger);
                resizeObserver.observe(document.documentElement);
            }
            else if (action === "disconnect") {
                console.log("Disconnecting document height observer...");
                if (resizeObserver) {
                    resizeObserver.disconnect();
                }
            }
        };
    })();
    const getAllScrollTrigger = (fn) => {
        let triggers = ScrollTrigger.getAll();
        triggers.forEach(trigger => {
            if (fn === "refresh") {
                if (trigger.progress === 0) {
                    trigger[fn]?.();
                }
            } else {
                trigger[fn]?.();
            }
        });
    };
    function resetScroll() {
        if (window.location.hash !== '') {
            if ($(window.location.hash).length >= 1) {
                $("html").animate({ scrollTop: $(window.location.hash).offset().top - 100 }, 1200);

                setTimeout(() => {
                    $("html").animate({ scrollTop: $(window.location.hash).offset().top - 100 }, 1200);
                }, 300);
            } else {
                scrollTop()
            }
        } else if (window.location.search !== '') {
            let searchObj = JSON.parse('{"' + decodeURI(location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}')
            if (searchObj.sc) {
                if ($(`#${searchObj.sc}`).length >= 1) {
                    let target = `#${searchObj.sc}`;
                    setTimeout(() => {
                        smoothScroll.scrollTo(`#${searchObj.sc}`, {
                            offset: -100
                        })
                    }, 500);
                } else {
                    scrollTop()
                }
            }
        } else {
            scrollTop()
        }
    };
    function scrollTop(onComplete) {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
        smoothScroll.scrollToTop({
            onComplete: () => {
                onComplete?.();
                getAllScrollTrigger("refresh");
            }
        });
    }
    class ParallaxImage {
        constructor({ el, scaleOffset = 0.1 }) {
            this.el = el;
            this.elWrap = null;
            this.scaleOffset = scaleOffset;
            this.init();
        }
        init() {
            this.elWrap = this.el.parentElement;
            this.setup();
        }
        setup() {
            const scalePercent = 100 + (this.scaleOffset * 100);
            gsap.set(this.el, {
                width: scalePercent + '%',
                height: $(this.el).hasClass('img-fill') ? scalePercent + '%' : 'auto'
            });
            this.scrub();
        }
        scrub() {
            let dist = this.el.offsetHeight - this.elWrap.offsetHeight;
            let total = this.elWrap.getBoundingClientRect().height + window.innerHeight;
            this.updateOnScroll(dist, total);
            smoothScroll.lenis.on('scroll', () => {
                this.updateOnScroll(dist, total);
            });
        }
        updateOnScroll(dist, total) {
            if (this.el) {
                if (isInViewport(this.elWrap)) {
                    let percent = this.elWrap.getBoundingClientRect().bottom / total;
                    gsap.quickSetter(this.el, 'y', 'px')(-dist * percent * 1.2);
                    gsap.set(this.el, { scale: 1 + (percent * this.scaleOffset) });
                }
            }
        }
    }
    class CounterUp {
        constructor(el, options = {}) {
            this.el = el;
            this.options = options;
            this.init();
        }
        init() {
            this.setup();
        }
        setup() {
            if (this.el.dataset.counter == 'false') return;
            let value = this.el.innerHTML;
            let hasDecimal = value.includes('.') || value.includes(',');
            let decimal = value.includes('.') ? '.' : value.includes(',') ? ',' : '';
            let suffix = value.includes('%') ? '%' : '';
            let counterTo = value.replace(/[,]/g, '.').replace(/[%]/g, '');
            let decimalPlaces = hasDecimal && counterTo.length - value.indexOf(decimal) - 1;
            const counter = new countUp.CountUp(this.el, counterTo, {
                duration: .4,
                decimalPlaces,
                decimal,
                suffix,
                enableScrollSpy: true,
                ...this.options
            });
        }
    }
    class SmoothScroll {
        constructor() {
            this.lenis = null;
            this.scroller = {
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                velocity: 0,
                direction: 0,
            };
            this.lastScroller = {
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                velocity: 0,
                direction: 0,
            };
        }

        init() {
            this.reInit();

            $.easing.lenisEase = function (t) {
                return Math.min(1, 1.001 - Math.pow(2, -10 * t));
            };

            gsap.ticker.add((time) => {
                if (this.lenis) {
                    this.lenis.raf(time * 1000);
                }
            });
            gsap.ticker.lagSmoothing(0);
        }

        reInit() {
            if (this.lenis) {
                this.lenis.destroy();
            }
            this.lenis = new Lenis();
            this.lenis.on("scroll", (e) => {
                this.updateOnScroll(e);
                ScrollTrigger.update();
            });
        }
        reachedThreshold(threshold) {
            if (!threshold) return false;
            const dist = distance(
                this.scroller.scrollX,
                this.scroller.scrollY,
                this.lastScroller.scrollX,
                this.lastScroller.scrollY
            );

            if (dist > threshold) {
                this.lastScroller = { ...this.scroller };
                return true;
            }
            return false;
        }

        updateOnScroll(e) {
            this.scroller.scrollX = e.scroll;
            this.scroller.scrollY = e.scroll;
            this.scroller.velocity = e.velocity;
            this.scroller.direction = e.direction;

            if (header) {
                header.updateOnScroll(smoothScroll.lenis);
            };
        }

        start() {
            if (this.lenis) {
                this.lenis.start();
            }
            $(".body").css("overflow", "initial");
        }

        stop() {
            if (this.lenis) {
                this.lenis.stop();
            }
            $(".body").css("overflow", "hidden");
        }

        scrollTo(target, options = {}) {
            if (this.lenis) {
                this.lenis.scrollTo(target, options);
            }
        }

        scrollToTop(options = {}) {
            if (this.lenis) {
                this.lenis.scrollTo("top", { duration: .0001, immediate: true, lock: true, ...options });
            }
        }

        destroy() {
            if (this.lenis) {
                gsap.ticker.remove((time) => {
                    this.lenis.raf(time * 1000);
                });
                this.lenis.destroy();
                this.lenis = null;
            }
        }
    }
    class TriggerSetup extends HTMLElement {
        constructor() {
            super();
            this.tlTrigger = null;
            this.onTrigger = () => { };
        }
        connectedCallback() {
            this.tlTrigger = gsap.timeline({
                scrollTrigger: {
                    trigger: $(this).find('section'),
                    start: 'top bottom+=50%',
                    end: 'bottom top-=50%',
                    once: true,
                    onEnter: () => {
                        this.onTrigger?.();
                    }
                }
            });
        }
        destroy() {
            if (this.tlTrigger) {
                this.tlTrigger.kill();
                this.tlTrigger = null;
            }
        }
    }

    const smoothScroll = new SmoothScroll();
    smoothScroll.init();

    class Header {
        constructor() {
            this.el = null;
            this.isOpen = false;
        }
        init(data) {
            this.el = document.querySelector('.header');
            if (viewport.w <= 991) {
                this.toggleNav();
            }
        }
        updateOnScroll(inst) {
            this.toggleHide(inst);
            this.toggleScroll(inst);
        }
        toggleScroll(inst) {
            if (inst.scroll > $(this.el).height() * 2) $(this.el).addClass("on-scroll");
            else $(this.el).removeClass("on-scroll");
        }
        toggleHide(inst) {
            if (inst.direction == 1) {
                if (inst.scroll > ($(this.el).height() * 3)) {
                    $(this.el).addClass('on-hide');
                }
            } else if (inst.direction == -1) {
                if (inst.scroll > ($(this.el).height() * 3)) {
                    $(this.el).addClass("on-hide");
                    $(this.el).removeClass("on-hide");
                }
            }
            else {
                $(this.el).removeClass("on-hide");
            }
        }
        toggleNav() {
            $(this.el).find('.header-toggle').on('click', this.handleClick.bind(this));
            // $(this.el).find('.header-link, .header-logo, .header-btn').on('click', () => setTimeout(() => this.close(), 800));
        }
        handleClick(e) {
            e.preventDefault();
            this.isOpen ? this.close() : this.open();
        }
        open() {
            if (this.isOpen) return;
            $(this.el).addClass('on-open-nav');
            $(this.el).find('.header-toggle').addClass('active');
            this.isOpen = true;
            smoothScroll.lenis.stop();
        }
        close() {
            if (!this.isOpen) return;
            $(this.el).removeClass('on-open-nav');
            $(this.el).find('.header-toggle').removeClass('active');
            this.isOpen = false;
            smoothScroll.lenis.start();
        }
    }
    const header = new Header();
    header.init();

    class CTA extends TriggerSetup {
        constructor() {
            super();
            this.onTrigger = () => {
                this.setup();
            }
        }
        setup() {
            // new ParallaxImage({ el: $(this).find('.cta-bg-inner img').get(0) });
        }
        destroy() {
            super.destroy();
        }
    }

    const HomePage = {
        'home-hero-wrap': class extends TriggerSetup {
            constructor() {
                super();
                this.emblaApi = null;
                this.tweenParallax = null;
                this.prevNextButtons = null;
                this.dotButtons = null;
                this.onTrigger = () => {
                    this.setup();
                    this.interact();
                }
            }
            setup() {
                $(this).find('.home-hero-slides-inner').addClass('embla__viewport');
                $(this).find('.home-hero-slides-wrapper').addClass('embla__container');
                $(this).find('.home-hero-slides-item').addClass('embla__slide');
                $(this).find('.home-hero-slides-item-img').addClass('embla__parallax');
                $(this).find('.home-hero-slides-item-img-inner').addClass('embla__parallax__layer');
                $(this).find('.home-hero-slides-item-img-inner img').addClass('embla__parallax__img');
            }
            interact() {
                this.initSlide();
                $('.home-hero-slides-item-img-inner img').each((index, img) => {
                    setTimeout(() => {
                        new ParallaxImage({ el: img });
                    }, index === 0 ? 4000 : 0);
                });
            }
            initSlide() {
                const slidesInner = $(this).find('.home-hero-slides-inner').get(0);
                const prevBtn = $(this).find('.home-hero-slide-pagin.prev').get(0);
                const nextBtn = $(this).find('.home-hero-slide-pagin.next').get(0);
                const dotsNode = $(this).find('.home-hero-slide-dots').get(0);
                const dotNodeTemplate = $(this).find('.home-hero-slide-dot').get(0);

                if (!slidesInner) return;

                this.emblaApi = EmblaCarousel(slidesInner, { loop: true, duration: 35 }, [EmblaCarouselAutoplay({ delay: 3000 })])
                this.tweenParallax = new TweenParallax(this.emblaApi);

                if (prevBtn && nextBtn) {
                    this.prevNextButtons = new PrevNextButtons(this.emblaApi, prevBtn, nextBtn);
                }

                if (dotsNode && dotNodeTemplate) {
                    this.dotButtons = new DotButtons(this.emblaApi, dotsNode, dotNodeTemplate);
                }
            }
            destroy() {
                super.destroy();
                this.tweenParallax?.destroy();
                this.prevNextButtons?.destroy();
                this.dotButtons?.destroy();
                if (this.emblaApi) {
                    this.emblaApi.destroy();
                    this.emblaApi = null;
                }
            }
        },
        'home-intro-wrap': class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                }
            }
            setup() {
                // $(this).find('.home-intro-img-inner img').each((_, img) => new ParallaxImage({ el: img }));
            }
            destroy() {
                super.destroy();
            }
        },
        'home-focus-wrap': class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    this.interact();
                }
            }
            setup() {
                new ParallaxImage({ el: $(this).find('.home-focus-img-inner img').get(0) });
            }
            interact() {
                const activeIdx = (idx) => {
                    $(this).find('.home-focus-item').eq(idx).addClass('active').siblings().removeClass('active');
                    $(this).find('.home-focus-item-desc').slideUp();
                    $(this).find('.home-focus-item-desc').eq(idx).slideDown();
                }
                $(this).find('.home-focus-item-title').on('click', function (e) {
                    const idx = $(this).parent().index();
                    activeIdx(idx);
                });
                activeIdx(0);
            }
            destroy() {
                super.destroy();
            }
        },
        'home-accelerate-wrap': class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                }
            }
            setup() {
                // new ParallaxImage({ el: $(this).find('.home-accelerate-img-inner img').get(0) });
            }
            destroy() {
                super.destroy();
            }
        },
        'home-news-wrap': class extends TriggerSetup {
            constructor() {
                super();
                this.emblaApi = null;
                this.dotButtons = null;
                this.onTrigger = () => {
                    this.setup();
                    this.interact();
                }
            }
            setup() {
                if (viewport.w < 767) {
                    $(this).find('.home-news-cms').addClass('embla__viewport');
                    $(this).find('.home-news-cms-list').addClass('embla__container');
                    $(this).find('.home-news-cms-item').addClass('embla__slide');
                }
            }
            interact() {
                if (viewport.w < 767) {
                    this.initSlider();
                }
            }
            initSlider() {
                const dotsNode = $(this).find('.home-news-slide-dots').get(0);
                const dotNodeTemplate = $(this).find('.home-news-slide-dot').get(0);
                this.emblaApi = EmblaCarousel($(this).find('.home-news-cms').get(0));

                if (dotsNode && dotNodeTemplate) {
                    this.dotButtons = new DotButtons(this.emblaApi, dotsNode, dotNodeTemplate);
                }
            }
            destroy() {
                super.destroy();
                this.dotButtons?.destroy();
                if (this.emblaApi) {
                    this.emblaApi.destroy();
                    this.emblaApi = null;
                }
            }
        },
        'home-cta-wrap': class extends CTA {
            constructor() { super(); }
        }
    }

    class PageManager {
        constructor(page) {
            if (!page || typeof page !== 'object') {
                throw new Error('Invalid page configuration');
            }

            // Store registered component names to prevent duplicate registration
            this.registeredComponents = new Set();

            this.sections = Object.entries(page).map(([name, Component]) => {
                if (typeof Component !== 'function') {
                    throw new Error(`Section "${name}" must be a class constructor`);
                }

                // Only register the custom element if not already registered
                if (!this.registeredComponents.has(name)) {
                    try {
                        customElements.define(name, Component);
                        this.registeredComponents.add(name);
                    } catch (error) {
                        // Handle case where element is already defined
                        console.warn(`Custom element "${name}" is already registered`);
                    }
                }

                return new Component();
            });
        }

        // Method to cleanup sections if needed
        destroy() {
            this.sections.forEach(section => {
                if (typeof section.destroy === 'function') {
                    section.destroy();
                }
            });
        }
    }
    const pageName = $('.main-inner').attr('data-barba-namespace');
    const pageConfig = {
        home: HomePage
    };
    const registry = {};
    registry[pageName]?.destroy();
    scrollTop(() => pageConfig[pageName] && (registry[pageName] = new PageManager(pageConfig[pageName])));
    documentHeightObserver("init");
    refreshOnBreakpoint();
}
window.onload = script
