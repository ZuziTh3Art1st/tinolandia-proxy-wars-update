'use client'
import * as React from 'react'
import { useEffect, useRef } from 'react'

function createNoise2D() {
    const hash = (x: number, y: number) => {
        const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
        return (value - Math.floor(value)) * 2 - 1
    }
    const fade = (value: number) => value * value * (3 - 2 * value)
    const mix = (a: number, b: number, amount: number) => a + (b - a) * amount
    return (x: number, y: number) => {
        const x0 = Math.floor(x)
        const y0 = Math.floor(y)
        const fx = fade(x - x0)
        const fy = fade(y - y0)
        return mix(
            mix(hash(x0, y0), hash(x0 + 1, y0), fx),
            mix(hash(x0, y0 + 1), hash(x0 + 1, y0 + 1), fx),
            fy,
        )
    }
}

interface Point {
    x: number
    y: number
    wave: { x: number; y: number }
    cursor: {
        x: number
        y: number
        vx: number
        vy: number
    }
}

interface WavesProps {
    className?: string
    strokeColor?: string
    backgroundColor?: string
    pointerSize?: number
}

export function Waves({
    className = "",
    strokeColor = "#ffffff",
    backgroundColor = "#000000",
    pointerSize = 0.5
}: WavesProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const mouseRef = useRef({
        x: -10,
        y: 0,
        lx: 0,
        ly: 0,
        sx: 0,
        sy: 0,
        v: 0,
        vs: 0,
        a: 0,
        set: false,
    })
    const pathsRef = useRef<SVGPathElement[]>([])
    const linesRef = useRef<Point[][]>([])
    const noiseRef = useRef<((x: number, y: number) => number) | null>(null)
    const rafRef = useRef<number | null>(null)
    const boundingRef = useRef<DOMRect | null>(null)
    const visibleRef = useRef(false)
    const reducedMotionRef = useRef(false)

    // Set up the noise field, draw the first frame, and watch for input.
    useEffect(() => {
        if (!containerRef.current || !svgRef.current) return

        noiseRef.current = createNoise2D()
        reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        setSize()
        setLines()
        drawLines()

        window.addEventListener('resize', onResize)
        window.addEventListener('mousemove', onMouseMove)
        containerRef.current.addEventListener('touchmove', onTouchMove, { passive: true })
        document.addEventListener('visibilitychange', onVisibilityChange)
        const observer = new IntersectionObserver(([entry]) => {
            visibleRef.current = !!entry?.isIntersecting
            syncAnimation()
        })
        observer.observe(containerRef.current)

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            observer.disconnect()
            window.removeEventListener('resize', onResize)
            window.removeEventListener('mousemove', onMouseMove)
            containerRef.current?.removeEventListener('touchmove', onTouchMove)
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [])

    const syncAnimation = () => {
        const shouldAnimate = visibleRef.current && !document.hidden && !reducedMotionRef.current
        if (shouldAnimate && rafRef.current === null) rafRef.current = requestAnimationFrame(tick)
        if (!shouldAnimate && rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }

    const onVisibilityChange = () => syncAnimation()

    // Keep the SVG aligned with its container.
    const setSize = () => {
        if (!containerRef.current || !svgRef.current) return

        boundingRef.current = containerRef.current.getBoundingClientRect()
        const { width, height } = boundingRef.current

        svgRef.current.style.width = `${width}px`
        svgRef.current.style.height = `${height}px`
    }

    // Rebuild the point grid whenever the container changes size.
    const setLines = () => {
        if (!svgRef.current || !boundingRef.current) return

        const { width, height } = boundingRef.current
        linesRef.current = []

        // Remove the old paths before drawing the new grid.
        pathsRef.current.forEach(path => {
            path.remove()
        })
        pathsRef.current = []

        // A tighter grid makes the curves smoother.
        const xGap = 14
        const yGap = 14

        const oWidth = width + 200
        const oHeight = height + 30

        const totalLines = Math.ceil(oWidth / xGap)
        const totalPoints = Math.ceil(oHeight / yGap)

        const xStart = (width - xGap * totalLines) / 2
        const yStart = (height - yGap * totalPoints) / 2

        // Build each vertical row of points and its SVG path.
        for (let i = 0; i < totalLines; i++) {
            const points: Point[] = []

            for (let j = 0; j < totalPoints; j++) {
                const point: Point = {
                    x: xStart + xGap * i,
                    y: yStart + yGap * j,
                    wave: { x: 0, y: 0 },
                    cursor: { x: 0, y: 0, vx: 0, vy: 0 },
                }

                points.push(point)
            }

            const path = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'path'
            )
            path.classList.add('a__line')
            path.classList.add('js-line')
            path.setAttribute('fill', 'none')
            path.setAttribute('stroke', strokeColor)
            path.setAttribute('stroke-width', '1')

            svgRef.current.appendChild(path)
            pathsRef.current.push(path)

            linesRef.current.push(points)
        }
    }

    // Redraw the grid after the window changes size.
    const onResize = () => {
        setSize()
        setLines()
        drawLines()
    }

    // Track pointer movement across the window.
    const onMouseMove = (e: MouseEvent) => {
        updateMousePosition(e.pageX, e.pageY)
    }

    // Track finger movement on touch screens.
    const onTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0]
        updateMousePosition(touch.clientX, touch.clientY)
    }

    // Convert pointer coordinates into the wave container's space.
    const updateMousePosition = (x: number, y: number) => {
        if (!boundingRef.current) return

        const mouse = mouseRef.current
        mouse.x = x - boundingRef.current.left
        mouse.y = y - boundingRef.current.top + window.scrollY

        if (!mouse.set) {
            mouse.sx = mouse.x
            mouse.sy = mouse.y
            mouse.lx = mouse.x
            mouse.ly = mouse.y

            mouse.set = true
        }

        if (containerRef.current) {
            containerRef.current.style.setProperty('--x', `${mouse.sx}px`)
            containerRef.current.style.setProperty('--y', `${mouse.sy}px`)
        }
    }

    // Add gentle waves and let nearby points respond to pointer movement.
    const movePoints = (time: number) => {
        const { current: lines } = linesRef
        const { current: mouse } = mouseRef
        const { current: noise } = noiseRef

        if (!noise) return

        lines.forEach((points) => {
            points.forEach((p: Point) => {
                const move = noise(
                    (p.x + time * 0.008) * 0.003,
                    (p.y + time * 0.003) * 0.002
                ) * 8

                p.wave.x = Math.cos(move) * 12
                p.wave.y = Math.sin(move) * 6

                const dx = p.x - mouse.sx
                const dy = p.y - mouse.sy
                const d = Math.hypot(dx, dy)
                const l = Math.max(175, mouse.vs)

                if (d < l) {
                    const s = 1 - d / l
                    const f = Math.cos(d * 0.001) * s

                    p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00035
                    p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00035
                }

                p.cursor.vx += (0 - p.cursor.x) * 0.01
                p.cursor.vy += (0 - p.cursor.y) * 0.01

                p.cursor.vx *= 0.95
                p.cursor.vy *= 0.95

                p.cursor.x += p.cursor.vx
                p.cursor.y += p.cursor.vy

                p.cursor.x = Math.min(50, Math.max(-50, p.cursor.x))
                p.cursor.y = Math.min(50, Math.max(-50, p.cursor.y))
            })
        })
    }

    // Combine a point's base position with its wave and optional pointer offset.
    const moved = (point: Point, withCursorForce = true) => {
        const coords = {
            x: point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0),
            y: point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0),
        }

        return coords
    }

    // Connect each row of points to draw the animated wave.
    const drawLines = () => {
        const { current: lines } = linesRef
        const { current: paths } = pathsRef

        lines.forEach((points, lIndex) => {
            if (points.length < 2 || !paths[lIndex]) return;

            const firstPoint = moved(points[0], false)
            let d = `M ${firstPoint.x} ${firstPoint.y}`

            for (let i = 1; i < points.length; i++) {
                const current = moved(points[i])
                d += `L ${current.x} ${current.y}`
            }

            paths[lIndex].setAttribute('d', d)
        })
    }

    // Update the pointer state and redraw the wave for this frame.
    const tick = (time: number) => {
        if (!visibleRef.current || document.hidden || reducedMotionRef.current) {
            rafRef.current = null
            return
        }
        const { current: mouse } = mouseRef

        // Ease the pointer position so it moves smoothly.
        mouse.sx += (mouse.x - mouse.sx) * 0.1
        mouse.sy += (mouse.y - mouse.sy) * 0.1

        // Track pointer speed for the interaction response.
        const dx = mouse.x - mouse.lx
        const dy = mouse.y - mouse.ly
        const d = Math.hypot(dx, dy)

        mouse.v = d
        mouse.vs += (d - mouse.vs) * 0.1
        mouse.vs = Math.min(100, mouse.vs)

        // Save the current coordinates for the next frame.
        mouse.lx = mouse.x
        mouse.ly = mouse.y

        mouse.a = Math.atan2(dy, dx)

        if (containerRef.current) {
            containerRef.current.style.setProperty('--x', `${mouse.sx}px`)
            containerRef.current.style.setProperty('--y', `${mouse.sy}px`)
        }

        movePoints(time)
        drawLines()

        rafRef.current = requestAnimationFrame(tick)
    }

    return (
        <div
            ref={containerRef}
            className={`waves-component relative overflow-hidden ${className}`}
            style={{
                backgroundColor,
                position: 'absolute',
                top: 0,
                left: 0,
                margin: 0,
                padding: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                '--x': '-0.5rem',
                '--y': '50%',
            } as React.CSSProperties}
        >
            <svg
                ref={svgRef}
                className="block w-full h-full js-svg"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
            />
            <div
                aria-hidden="true"
                className="pointer-dot"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${pointerSize}rem`,
                    height: `${pointerSize}rem`,
                    background: strokeColor,
                    borderRadius: '50%',
                    transform: 'translate3d(calc(var(--x) - 50%), calc(var(--y) - 50%), 0)',
                    willChange: 'transform',
                }}
            />
        </div>
    )
}
