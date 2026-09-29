import { useEffect, useRef } from 'react'

// Shader source and visual defaults from HU_CHAIN's splash Galaxy.
const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
}
`

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;
uniform float uLightMode;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float tri(float x) {
    return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
    float t = fract(x);
    return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
    float t = fract(x);
    return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
    float d = length(uv);
    float m = (0.05 * uGlowIntensity) / d;
    float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
    m += rays * flare * uGlowIntensity;
    uv *= MAT45;
    rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
    m += rays * 0.3 * flare * uGlowIntensity;
    m *= smoothstep(1.0, 0.2, d);
    return m;
}

vec3 StarLayer(vec2 uv) {
    vec3 col = vec3(0.0);

    vec2 gv = fract(uv) - 0.5;
    vec2 id = floor(uv);

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
            vec2 si = id + vec2(float(x), float(y));
            float seed = Hash21(si);
            float size = fract(seed * 345.32);
            float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
            float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

            float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
            float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
            float grn = min(red, blu) * seed;
            vec3 base = vec3(red, grn, blu);

            float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
            hue = fract(hue + uHueShift / 360.0);
            float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
            float val = max(max(base.r, base.g), base.b);
            base = hsv2rgb(vec3(hue, sat, val));

            vec2 pad = vec2(
                tris(seed * 34.0 + uTime * uSpeed / 10.0),
                tris(seed * 38.0 + uTime * uSpeed / 30.0)
            ) - 0.5;

            float star = Star(gv - offset - pad, flareSize);
            vec3 color = base;

            float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
            twinkle = mix(1.0, twinkle, uTwinkleIntensity);
            star *= twinkle;

            col += star * size * color;
        }
    }

    return col;
}

void main() {
    vec2 focalPx = uFocal * uResolution.xy;
    vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

    vec2 mouseNorm = uMouse - vec2(0.5);

    if (uAutoCenterRepulsion > 0.0) {
        vec2 centerUV = vec2(0.0, 0.0);
        float centerDist = length(uv - centerUV);
        vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
        uv += repulsion * 0.05;
    } else if (uMouseRepulsion) {
        vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
        float mouseDist = length(uv - mousePosUV);
        vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
        uv += repulsion * 0.05 * uMouseActiveFactor;
    } else {
        vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
        uv += mouseOffset;
    }

    float autoRotAngle = uTime * uRotationSpeed;
    mat2 autoRot = mat2(
        cos(autoRotAngle),
        -sin(autoRotAngle),
        sin(autoRotAngle),
        cos(autoRotAngle)
    );
    uv = autoRot * uv;

    uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

    vec3 col = vec3(0.0);

    for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
        float depth = fract(i + uStarSpeed * uSpeed);
        float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
        float fade = depth * smoothstep(1.0, 0.9, depth);
        col += StarLayer(uv * scale + i * 453.32) * fade;
    }

    if (uLightMode > 0.5) {
        float energy = max(max(col.r, col.g), col.b);
        float coverage = clamp(smoothstep(0.0, 0.42, energy) * 0.92, 0.0, 0.92);
        vec3 ink = clamp(col * 0.48, 0.0, 0.82);
        gl_FragColor = vec4(mix(vec3(1.0), ink, coverage), 1.0);
    } else if (uTransparent) {
        float alpha = length(col);
        alpha = smoothstep(0.0, 0.3, alpha);
        alpha = min(alpha, 1.0);
        gl_FragColor = vec4(col, alpha);
    } else {
        gl_FragColor = vec4(col, 1.0);
    }
}
`

export default function Galaxy() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
        if (!gl) return
        const shaders: WebGLShader[] = []
        const buffers: WebGLBuffer[] = []
        const program = gl.createProgram()
        if (!program) return
        let frame = 0
        const release = () => {
            cancelAnimationFrame(frame)
            buffers.forEach((buffer) => gl.deleteBuffer(buffer))
            shaders.forEach((shader) => gl.deleteShader(shader))
            gl.deleteProgram(program)
        }
        try {
            for (const [kind, source] of [[gl.VERTEX_SHADER, vertexShader], [gl.FRAGMENT_SHADER, fragmentShader]] as const) {
                const shader = gl.createShader(kind)
                if (!shader) throw new Error('Shader unavailable')
                shaders.push(shader)
                gl.shaderSource(shader, source)
                gl.compileShader(shader)
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader compilation failed')
                gl.attachShader(program, shader)
            }
            gl.linkProgram(program)
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader linking failed')
            gl.useProgram(program)
            for (const [name, data] of [['position', [-1, -1, 3, -1, -1, 3]], ['uv', [0, 0, 2, 0, 0, 2]]] as const) {
                const buffer = gl.createBuffer()
                if (!buffer) throw new Error('Buffer unavailable')
                buffers.push(buffer)
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
                const attribute = gl.getAttribLocation(program, name)
                gl.enableVertexAttribArray(attribute)
                gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0)
            }
            const uniform = (name: string) => gl.getUniformLocation(program, name)
            for (const [name, value] of Object.entries({ uDensity: 1.5, uHueShift: 240, uSpeed: .5, uGlowIntensity: .5,
                uSaturation: .8, uTwinkleIntensity: .3, uRotationSpeed: .1, uRepulsionStrength: 1,
                uMouseActiveFactor: 0, uAutoCenterRepulsion: 0, uLightMode: 0 })) gl.uniform1f(uniform(name), value)
            gl.uniform2f(uniform('uFocal'), .5, .5)
            gl.uniform2f(uniform('uRotation'), 1, 0)
            gl.uniform2f(uniform('uMouse'), .5, .5)
            gl.uniform1i(uniform('uMouseRepulsion'), 1)
            gl.uniform1i(uniform('uTransparent'), 1)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            gl.clearColor(0, 0, 0, 0)
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            const mouse = { x: .5, y: .5, active: 0 }
            const target = { ...mouse }
            const move = (event: MouseEvent) => {
                const rect = canvas.getBoundingClientRect()
                if (!rect.width || !rect.height) return
                target.x = (event.clientX - rect.left) / rect.width
                target.y = 1 - (event.clientY - rect.top) / rect.height
                target.active = target.x >= 0 && target.x <= 1 && target.y >= 0 && target.y <= 1 ? 1 : 0
            }
            const leave = () => { target.active = 0 }
            const resize = () => {
                const width = Math.max(1, canvas.clientWidth)
                const height = Math.max(1, canvas.clientHeight)
                if (canvas.width !== width) canvas.width = width
                if (canvas.height !== height) canvas.height = height
                gl.viewport(0, 0, canvas.width, canvas.height)
                gl.uniform3f(uniform('uResolution'), canvas.width, canvas.height, canvas.width / canvas.height)
            }
            const draw = (time: number) => {
                if (document.hidden) return
                resize()
                const seconds = reducedMotion ? 0 : time * .001
                gl.uniform1f(uniform('uTime'), seconds)
                gl.uniform1f(uniform('uStarSpeed'), seconds * .5 / 10)
                mouse.x += (target.x - mouse.x) * .05
                mouse.y += (target.y - mouse.y) * .05
                mouse.active += (target.active - mouse.active) * .05
                gl.uniform2f(uniform('uMouse'), mouse.x, mouse.y)
                gl.uniform1f(uniform('uMouseActiveFactor'), mouse.active)
                gl.clear(gl.COLOR_BUFFER_BIT)
                gl.drawArrays(gl.TRIANGLES, 0, 3)
                if (!reducedMotion) frame = requestAnimationFrame(draw)
            }
            draw(0)
            const visibility = () => {
                cancelAnimationFrame(frame)
                if (!document.hidden) {
                    if (reducedMotion) draw(0)
                    else frame = requestAnimationFrame(draw)
                }
            }
            window.addEventListener('mousemove', move, { passive: true })
            window.addEventListener('blur', leave)
            document.addEventListener('visibilitychange', visibility)
            const observer = new ResizeObserver(() => { if (reducedMotion) draw(0) })
            observer.observe(canvas)
            return () => {
                observer.disconnect()
                window.removeEventListener('mousemove', move)
                window.removeEventListener('blur', leave)
                document.removeEventListener('visibilitychange', visibility)
                release()
            }
        } catch {
            release()
            return undefined
        }
    }, [])
    return <canvas ref={canvasRef} />
}
