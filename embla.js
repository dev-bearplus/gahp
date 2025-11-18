class TweenParallax {
    constructor(emblaApi) {
        this.TWEEN_FACTOR_BASE = 0.2
        this.tweenFactor = 0
        this.tweenNodes = []
        this.emblaApi = emblaApi
        this.init()
    }

    setTweenNodes() {
        this.tweenNodes = this.emblaApi.slideNodes().map((slideNode) => {
            return slideNode.querySelector('.embla__parallax__layer')
        })
    }

    setTweenFactor() {
        this.tweenFactor = this.TWEEN_FACTOR_BASE * this.emblaApi.scrollSnapList().length
    }

    tweenParallax(eventName) {
        const engine = this.emblaApi.internalEngine()
        const scrollProgress = this.emblaApi.scrollProgress()
        const slidesInView = this.emblaApi.slidesInView()
        const isScrollEvent = eventName === 'scroll'

        this.emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
            let diffToTarget = scrollSnap - scrollProgress
            const slidesInSnap = engine.slideRegistry[snapIndex]

            slidesInSnap.forEach((slideIndex) => {
                if (isScrollEvent && !slidesInView.includes(slideIndex)) return

                if (engine.options.loop) {
                    engine.slideLooper.loopPoints.forEach((loopItem) => {
                        const target = loopItem.target()

                        if (slideIndex === loopItem.index && target !== 0) {
                            const sign = Math.sign(target)

                            if (sign === -1) {
                                diffToTarget = scrollSnap - (1 + scrollProgress)
                            }
                            if (sign === 1) {
                                diffToTarget = scrollSnap + (1 - scrollProgress)
                            }
                        }
                    })
                }

                const translate = diffToTarget * (-1 * this.tweenFactor) * 100
                const tweenNode = this.tweenNodes[slideIndex]
                tweenNode.style.transform = `translateX(${translate}%)`
            })
        })
    }

    init() {
        this.setTweenNodes()
        this.setTweenFactor()
        this.tweenParallax()

        this.emblaApi
            .on('reInit', () => this.setTweenNodes())
            .on('reInit', () => this.setTweenFactor())
            .on('reInit', () => this.tweenParallax())
            .on('scroll', () => this.tweenParallax('scroll'))
            .on('slideFocus', () => this.tweenParallax())
    }

    destroy() {
        this.tweenNodes.forEach((slide) => slide.removeAttribute('style'))
    }
}

class PrevNextButtons {
    constructor(emblaApi, prevBtn, nextBtn) {
        this.emblaApi = emblaApi
        this.prevBtn = prevBtn
        this.nextBtn = nextBtn
        this.scrollPrevHandler = () => this.scrollPrev()
        this.scrollNextHandler = () => this.scrollNext()
        this.toggleStateHandler = () => this.updateButtonState()
        this.init()
    }

    updateButtonState() {
        if (this.emblaApi.canScrollPrev()) {
            this.prevBtn.classList.remove('disable')
        } else {
            this.prevBtn.classList.add('disable')
        }

        if (this.emblaApi.canScrollNext()) {
            this.nextBtn.classList.remove('disable')
        } else {
            this.nextBtn.classList.add('disable')
        }
    }

    scrollPrev() {
        this.emblaApi.scrollPrev()
    }

    scrollNext() {
        this.emblaApi.scrollNext()
    }

    init() {
        this.updateButtonState()

        this.emblaApi
            .on('select', this.toggleStateHandler)
            .on('init', this.toggleStateHandler)
            .on('reInit', this.toggleStateHandler)
        this.prevBtn.addEventListener('click', this.scrollPrevHandler, false)
        this.nextBtn.addEventListener('click', this.scrollNextHandler, false)
    }

    destroy() {
        this.prevBtn.classList.remove('disable')
        this.nextBtn.classList.remove('disable')
        this.prevBtn.removeEventListener('click', this.scrollPrevHandler, false)
        this.nextBtn.removeEventListener('click', this.scrollNextHandler, false)
    }
}

class DotButtons {
    constructor(emblaApi, dotsNode, dotNodeTemplate) {
        this.emblaApi = emblaApi
        this.dotsNode = dotsNode
        this.dotNodeTemplate = dotNodeTemplate
        this.dotNodes = []
        this.clickHandlers = []
        this.addDotBtnsHandler = () => this.addDotBtnsWithClickHandlers()
        this.toggleActiveHandler = () => this.toggleDotBtnsActive()
        this.init()
    }

    scrollTo(index) {
        this.emblaApi.scrollTo(index)
    }

    addDotBtnsWithClickHandlers() {
        this.dotsNode.innerHTML = this.emblaApi
            .scrollSnapList()
            .map(() => this.dotNodeTemplate.cloneNode(true).outerHTML)
            .join('')

        // Remove old click handlers before adding new ones
        this.clickHandlers.forEach((handler, index) => {
            if (this.dotNodes[index]) {
                this.dotNodes[index].removeEventListener('click', handler, false)
            }
        })
        this.clickHandlers = []

        this.dotNodes = Array.from(this.dotsNode.children)
        this.dotNodes.forEach((dotNode, index) => {
            const handler = () => this.scrollTo(index)
            this.clickHandlers.push(handler)
            dotNode.addEventListener('click', handler, false)
        })
    }

    toggleDotBtnsActive() {
        const previous = this.emblaApi.previousScrollSnap()
        const selected = this.emblaApi.selectedScrollSnap()
        if (this.dotNodes[previous]) {
            this.dotNodes[previous].classList.remove('active');
        }
        if (this.dotNodes[selected]) {
            this.dotNodes[selected].classList.add('active');
        }
    }

    init() {
        this.emblaApi
            .on('init', this.addDotBtnsHandler)
            .on('reInit', this.addDotBtnsHandler)
            .on('init', this.toggleActiveHandler)
            .on('reInit', this.toggleActiveHandler)
            .on('select', this.toggleActiveHandler)
    }

    destroy() {
        // Remove all click handlers
        this.clickHandlers.forEach((handler, index) => {
            if (this.dotNodes[index]) {
                this.dotNodes[index].removeEventListener('click', handler, false)
            }
        })
        this.dotsNode.innerHTML = ''
        this.dotNodes = []
        this.clickHandlers = []
    }
}

