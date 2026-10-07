/* main.js — WebGL2 harness for the raymarched crystal journey.
 *
 * Owns: canvas, shader compile/link, render loop, scroll → uScroll mapping,
 * mouse → uMouse, intro fade → uIntro, adaptive resolution for FPS.
 * UI layer (ui.js) owns sections, language, nav; we call window.UI hooks.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('bg');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- WebGL2 context ---------- */
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  });
  if (!gl) {
    document.body.classList.add('no-webgl');
    return;
  }

  /* ---------- fullscreen triangle ---------- */
  const vsSrc = `#version 300 es
  layout(location=0) in vec2 aPos;
  void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
  const fsHeader = `#version 300 es
  precision highp float;
  `;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      console.error('Shader compile error:', log);
      throw new Error(log);
    }
    return sh;
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  let prog = null;
  const U = {};

  function buildProgram(fsBody) {
    const vs = compile(gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsHeader + fsBody);
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p));
    }
    if (prog) gl.deleteProgram(prog);
    prog = p;
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    ['uRes', 'uTime', 'uScroll', 'uMouse', 'uIntro'].forEach((n) => {
      U[n] = gl.getUniformLocation(prog, n);
    });
  }

  /* ---------- adaptive resolution ---------- */
  const MAX_DPR = 1.75;
  let scale = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  let W = 0, H = 0;
  function resize() {
    W = Math.max(1, Math.floor(canvas.clientWidth * scale));
    H = Math.max(1, Math.floor(canvas.clientHeight * scale));
    canvas.width = W;
    canvas.height = H;
    gl.viewport(0, 0, W, H);
  }
  window.addEventListener('resize', resize, { passive: true });

  /* FPS governor: if sustained < 45fps, drop internal res in steps. */
  let frames = 0, fpsWindowStart = performance.now(), scaleFloor = 0.55;
  function govern(now) {
    frames++;
    if (now - fpsWindowStart >= 2000) {
      const fps = (frames * 1000) / (now - fpsWindowStart);
      if (fps < 45 && scale > scaleFloor) {
        scale = Math.max(scaleFloor, scale - 0.25);
        resize();
      }
      frames = 0;
      fpsWindowStart = now;
    }
  }

  /* ---------- input state ---------- */
  let scrollTarget = 0, scrollSmooth = 0;
  let mx = 0, my = 0, mxS = 0, myS = 0;
  let intro = 0;
  const INTRO_SECONDS = 2.2;

  window.addEventListener(
    'scroll',
    () => {
      const ui = window.UI;
      scrollTarget = ui && ui.getScrollProgress ? ui.getScrollProgress() : 0;
    },
    { passive: true }
  );
  window.addEventListener(
    'mousemove',
    (e) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );

  /* ---------- render loop ---------- */
  let raf = 0;
  let t0 = performance.now();
  let lastT = t0;

  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const t = (now - t0) / 1000;

    intro = Math.min(1, intro + dt / INTRO_SECONDS);
    // critically-damped-ish smoothing
    scrollSmooth += (scrollTarget - scrollSmooth) * Math.min(1, dt * 6);
    mxS += (mx - mxS) * Math.min(1, dt * 3);
    myS += (my - myS) * Math.min(1, dt * 3);

    gl.uniform2f(U.uRes, W, H);
    gl.uniform1f(U.uTime, reduced ? 0 : t);
    gl.uniform1f(U.uScroll, scrollSmooth);
    gl.uniform2f(U.uMouse, mxS, myS);
    gl.uniform1f(U.uIntro, intro);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    govern(now);
    raf = requestAnimationFrame(frame);
  }

  /* ---------- boot ---------- */
  function pullScrollOnce() {
    const ui = window.UI;
    scrollTarget = ui && ui.getScrollProgress ? ui.getScrollProgress() : 0;
    scrollSmooth = scrollTarget;
  }

  window
    .loadShader('shader.frag')
    .then((src) => {
      // strip any duplicate version/precision the shader file may carry
      const body = src
        .split('\n')
        .filter((l) => !/^#version/.test(l.trim()))
        .filter((l) => !/^precision\s+(highp|mediump|lowp)\s+float\s*;/.test(l.trim()))
        .join('\n');
      buildProgram(body);
      resize();
      pullScrollOnce();
      raf = requestAnimationFrame(frame);
      document.body.classList.add('webgl-ready');
    })
    .catch((err) => {
      console.error('Harness failed:', err);
      document.body.classList.add('no-webgl');
    });

  /* pause when tab hidden */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      lastT = performance.now();
      fpsWindowStart = lastT;
      frames = 0;
      raf = requestAnimationFrame(frame);
    }
  });
})();
