import { useEffect, useRef, type ReactNode } from "react";

// Liquid-fill shader ported from the "Nexus tactile fluidics" button, recoloured to the TERESA blues.
const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const FS = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_level;
uniform float u_tilt;
uniform float u_slosh;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.04+vec2(11.3,7.1); a*=0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float ar = u_res.x / u_res.y;
  float x = uv.x * ar;
  float t = u_time;
  float amp = 0.012 + u_slosh * 0.045;
  float surf = u_level
    + u_tilt * (uv.x - 0.5) * 0.34
    + amp * sin(x * 5.1 + t * 4.6)
    + amp * 0.62 * sin(x * 9.7 + t * (-6.8) + 1.7)
    + amp * 0.38 * sin(x * 14.3 + t * 8.9 + 4.2);
  float d = surf - uv.y;
  vec3 col = mix(vec3(0.03, 0.05, 0.10), vec3(0.05, 0.08, 0.16), uv.y);
  col += vec3(0.02, 0.04, 0.10) * pow(max(0.0, 1.0 - abs(uv.y - 0.88) * 6.0), 2.0);
  float inside = smoothstep(0.0, 0.012, d);
  float depth = clamp(d / max(u_level, 0.001), 0.0, 1.0);
  vec3 liq = mix(vec3(0.30, 0.62, 1.0), vec3(0.04, 0.12, 0.45), depth);
  float caust = fbm(vec2(x * 4.2, (uv.y + t * 0.14) * 4.2));
  liq *= 0.8 + 0.42 * caust;
  liq += vec3(0.05, 0.18, 0.40) * pow(max(0.0, d * 3.0), 1.5) * u_slosh;
  col = mix(col, liq, inside);
  col += vec3(0.50, 0.72, 1.0) * exp(-abs(d) * 80.0) * 0.85;
  col += vec3(0.85, 0.92, 1.0) * exp(-abs(d) * 220.0) * 0.5;
  vec2 e = uv * (1.0 - uv);
  col *= 0.55 + 0.45 * pow(e.x * e.y * 16.0, 0.22);
  gl_FragColor = vec4(col, 1.0);
}
`;

const BASE_LEVEL = 0.56;

export interface TactileButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * A button filled with a sloshing liquid: sweeping the cursor stirs it, clicking drains it.
 * Falls back to a static CSS fill without WebGL; motion is damped under prefers-reduced-motion.
 */
export function TactileButton({ children, onClick, className }: TactileButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ level: BASE_LEVEL, gulp: 0, slosh: 0.4, tilt: 0, tiltTarget: 0, lastX: null as number | null });

  useEffect(() => {
    const btn = btnRef.current;
    const canvas = canvasRef.current;
    if (!btn || !canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl");
    if (!gl) {
      btn.classList.add("tactile-btn--static");
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
      btn.classList.add("tactile-btn--static");
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const locP = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(locP);
    gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uLevel = gl.getUniformLocation(prog, "u_level");
    const uTilt = gl.getUniformLocation(prog, "u_tilt");
    const uSlosh = gl.getUniformLocation(prog, "u_slosh");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const s = state.current;
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.slosh *= Math.exp(-1.5 * dt);
      s.gulp *= Math.exp(-1.1 * dt);
      s.tilt += (s.tiltTarget - s.tilt) * Math.min(1, dt * 5);
      const levelTarget = BASE_LEVEL - 0.36 * s.gulp;
      s.level += (levelTarget - s.level) * Math.min(1, dt * 5.5);

      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduced ? 2.0 : now / 1000);
      gl.uniform1f(uLevel, s.level);
      gl.uniform1f(uTilt, s.tilt);
      gl.uniform1f(uSlosh, reduced ? 0.25 : s.slosh);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <div className={`tactile-btn__frame${className ? ` ${className}` : ""}`}>
      <button
        ref={btnRef}
        type="button"
        className="tactile-btn"
        onMouseMove={(e) => {
          const s = state.current;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / Math.max(1, rect.width);
          if (s.lastX !== null) s.slosh = Math.min(1.4, s.slosh + Math.abs(x - s.lastX) * 2.6);
          s.lastX = x;
          s.tiltTarget = Math.max(-1, Math.min(1, (x - 0.5) * 2));
        }}
        onMouseLeave={() => {
          state.current.lastX = null;
          state.current.tiltTarget = 0;
        }}
        onFocus={() => {
          state.current.slosh = Math.min(1.4, state.current.slosh + 0.5);
        }}
        onClick={() => {
          state.current.gulp = 1;
          state.current.slosh = Math.min(1.4, state.current.slosh + 0.7);
          onClick?.();
        }}
      >
        <canvas ref={canvasRef} className="tactile-btn__gl" aria-hidden="true" />
        <span className="tactile-btn__label">{children}</span>
      </button>
    </div>
  );
}
