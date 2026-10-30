import { useEffect, useRef } from "react";

// Shader from componentry's HeroGeometric: dithered diagonal gradient with slow simplex-noise drift.
// Drawn as a full-screen triangle with plain WebGL (the r3f version froze on three r183 and only
// showed the middle of the gradient).
const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

const FS = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// 4x4 Bayer matrix computed arithmetically (GLSL ES 1.0 has no dynamic array indexing guarantee).
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayerDither4x4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 coord = gl_FragCoord.xy;

  float noise = snoise(uv * 1.5 + vec2(uTime * 0.18, uTime * 0.11)) * 0.28;
  float sweep = 0.07 * sin(uTime * 0.35) + 0.04 * sin(uTime * 0.21 + uv.x * 3.0);
  float diagonal = (uv.x + uv.y) * 0.5 + sweep;
  float gradient = diagonal * 1.2 + noise;

  vec3 deepBlue = uColor1;
  vec3 paleBlue = uColor2;
  vec3 softBlue = mix(deepBlue, paleBlue, 0.33);
  vec3 lightBlue = mix(deepBlue, paleBlue, 0.66);

  vec3 color;
  if (gradient < 0.3) {
    color = deepBlue;
  } else if (gradient < 0.55) {
    color = softBlue;
  } else if (gradient < 0.8) {
    color = lightBlue;
  } else {
    color = paleBlue;
  }

  float dither = bayerDither4x4(coord);
  float threshold = fract(gradient * 4.0);

  if (gradient < 0.3 && threshold > dither * 0.5) {
    color = softBlue;
  } else if (gradient >= 0.3 && gradient < 0.55 && threshold > dither * 0.5) {
    color = lightBlue;
  } else if (gradient >= 0.55 && gradient < 0.8 && threshold > dither * 0.5) {
    color = paleBlue;
  }

  float fadeMask = smoothstep(0.0, 0.25, length(uv));
  color = mix(vec3(1.0), color, fadeMask);

  float vignette = smoothstep(1.2, 0.3, length(uv - 0.5));
  color = mix(color, color * 0.95, (1.0 - vignette) * 0.3);

  gl_FragColor = vec4(color, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export default function HeroGeometricCanvas({
  color1,
  color2,
  speed,
  onFail,
}: {
  color1: string;
  color2: string;
  speed: number;
  onFail?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read the latest props inside the render loop without restarting it.
  const props = useRef({ color1, color2, speed });
  useEffect(() => {
    props.current = { color1, color2, speed };
  }, [color1, color2, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) {
      onFail?.();
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("[TERESA] Hero shader failed to compile.", gl.getProgramInfoLog(prog));
      onFail?.();
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const locP = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(locP);
    gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "uTime");
    const uRes = gl.getUniformLocation(prog, "uResolution");
    const uC1 = gl.getUniformLocation(prog, "uColor1");
    const uC2 = gl.getUniformLocation(prog, "uColor2");

    // Pixel ratio 1 keeps the dither pattern crisp and the shader cheap, as in the original.
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth));
      const h = Math.max(1, Math.round(canvas.clientHeight));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    let elapsed = 0;
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const p = props.current;
      elapsed += dt * p.speed;
      resize();
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform3fv(uC1, hexToRgb(p.color1));
      gl.uniform3fv(uC2, hexToRgb(p.color2));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [onFail]);

  return <canvas ref={canvasRef} className="hero-geo__canvas" />;
}
