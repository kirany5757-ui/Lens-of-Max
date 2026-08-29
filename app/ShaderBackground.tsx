"use client";

import { useEffect, useRef } from "react";

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;

  void main() {
      // Normalize coordinates
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      
      // Account for aspect ratio
      uv.x *= u_resolution.x / u_resolution.y;
      
      // Slow down time for a subtle, elegant effect
      float t = u_time * 0.15;
      
      // Create organic, slow-moving fluid waves
      vec2 p = uv * 2.0 - vec2(1.0);
      for(int i = 1; i < 4; i++) {
          vec2 newp = p;
          float fi = float(i);
          newp.x += 0.6 / fi * sin(fi * p.y + t + 0.3) + 0.5;
          newp.y += 0.6 / fi * cos(fi * p.x + t + 0.3) + 0.5;
          p = newp;
      }
      
      // Base color: much more visible warm grey
      vec3 baseCol = vec3(0.06, 0.05, 0.04);
      
      // Highlight color: bright warm grey so the waves pop out
      vec3 highCol = vec3(0.20, 0.18, 0.16);
      
      // Mix based on the wave pattern
      float wave = cos(p.x + p.y + 1.0) * 0.5 + 0.5;
      vec3 finalColor = mix(baseCol, highCol, wave * 0.5);
      
      // Add subtle vignette at the edges
      float vignette = length(uv - vec2(0.5 * (u_resolution.x/u_resolution.y), 0.5));
      finalColor -= vignette * 0.02;
      
      gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.warn("WebGL not supported");
      return;
    }

    // Compile Shader
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    // Create Program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Fullscreen Quad Triangle Strip
    const vertices = new Float32Array([
      -1.0, -1.0,  
       1.0, -1.0,  
      -1.0,  1.0,  
       1.0,  1.0
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc = gl.getUniformLocation(program, "u_time");
    const uResLoc = gl.getUniformLocation(program, "u_resolution");

    let animationFrameId: number;
    const startTime = performance.now();

    const resize = () => {
      // Use devicePixelRatio for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResLoc, canvas.width, canvas.height);
    };

    window.addEventListener("resize", resize);
    resize();

    const render = (time: number) => {
      gl.uniform1f(uTimeLoc, (time - startTime) * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
        opacity: 1 // Full opacity since colors match the theme
      }}
    />
  );
}
