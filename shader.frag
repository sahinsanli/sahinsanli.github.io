// ============================================================================
//  MONOLIT — raymarched crystal journey (single fragment shader, WebGL2)
//  GLSL ES 3.00 · no assets · no libraries
//
//  Journey (uScroll 0..1) — segment boundaries locked to the UI reveal windows:
//    APPROACH / HERO        0.00–0.15  far drift among stars/dust, shard distant
//    SURFACE / ABOUT        0.15–0.35  flying in, facets + glass fresnel resolve
//    INTERIOR / WORK        0.35–0.60  pierce the shell (~0.42), 3 glowing veins
//    DISSOLVE / EXPERIENCE  0.60–0.82  crystal breaks into a particle cloud
//    CORE / CONTACT         0.82–1.00  small glowing core (contact)
//
//  Anti-aliasing: 2-sample rotated-grid supersampling (no MSAA needed).
//  Post: ACES-ish tonemap, vignette, hash grain, chromatic aberration (stars).
// ============================================================================

#version 300 es
precision highp float;

uniform vec2  uRes;    // viewport resolution (px)
uniform float uTime;   // seconds
uniform float uScroll; // 0..1 journey progress
uniform vec2  uMouse;  // -1..1 parallax
uniform float uIntro;  // 0..1 intro fade-in (0 = black)

out vec4 fragColor;

// ---------- palette --------------------------------------------------------
const vec3 LIME   = vec3(0.784, 1.000, 0.243); // #c8ff3e
const vec3 VIOLET = vec3(0.486, 0.373, 1.000); // #7c5cff
const vec3 CYAN   = vec3(0.220, 0.910, 1.000); // #38e8ff

// ---------- per-frame globals (set once in main) ---------------------------
float gDissolve; // 0..1 crystal breakup amount
float gVeinVis;  // vein glow strength (subtle outside, strong inside)
float gCoreR;   // core radius (shrinks toward CONTACT so it stays small in frame)
float gBob;      // crystal vertical bob
float gYaw;      // crystal sway
float gRoll;     // camera roll

// ---------- utils ----------------------------------------------------------
mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    float a = hash13(i);
    float b = hash13(i + vec3(1.0, 0.0, 0.0));
    float c = hash13(i + vec3(0.0, 1.0, 0.0));
    float d = hash13(i + vec3(1.0, 1.0, 0.0));
    float e = hash13(i + vec3(0.0, 0.0, 1.0));
    float g = hash13(i + vec3(1.0, 0.0, 1.0));
    float h = hash13(i + vec3(0.0, 1.0, 1.0));
    float k = hash13(i + vec3(1.0, 1.0, 1.0));
    return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
               mix(mix(e, g, u.x), mix(h, k, u.x), u.y), u.z);
}

// ---------- SDFs -----------------------------------------------------------
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Wavy glowing vein: thin box along Y, sinusoidal lateral drift.
// Scaled by 0.7 to stay conservative (displacement inflates the gradient).
float sdVein(vec3 p, float phase, float ang, float offX) {
    vec3 q = p;
    q.x += offX;
    q.x += 0.28 * sin(q.y * 1.9 + uTime * 0.22 + phase);
    q.z += 0.20 * sin(q.y * 1.4 + uTime * 0.18 + phase * 1.7);
    q.xz = rot2(ang) * q.xz;
    return (sdBox(q, vec3(0.030, 2.5, 0.030)) - 0.010) * 0.7;
}

// ---------- scene map: returns (distance, material id) ---------------------
// id: 1 = obsidian shell, 2/3/4 = veins (lime/violet/cyan), 5 = core
vec2 map(vec3 p) {
    // crystal shard: faceted box, hollow shell (so we can fly inside)
    vec3 q = p - vec3(0.0, gBob, 0.0);
    q.xz = rot2(gYaw) * q.xz;
    float dB = sdBox(q, vec3(0.95, 3.3, 0.75));
    vec3 aq = abs(q);
    float cut1 = dot(aq, vec3(0.699, 0.403, 0.591)) - 1.38; // chamfer long edges
    float cut2 = dot(aq, vec3(0.104, 0.987, 0.125)) - 3.42; // chamfer tips
    float dC = max(max(dB, cut1), cut2);
    float d = abs(dC) - 0.055; // shell thickness

    // DISSOLVE: noise displacement tears the shell apart
    if (gDissolve > 0.002) {
        float n1 = vnoise(q * 3.5 + vec3(0.0, uTime * 0.15, 0.0)) - 0.5;
        float n2 = vnoise(q * 8.0 - vec3(uTime * 0.10, 0.0, 0.0)) - 0.5;
        d += (n1 * 0.9 + n2 * 0.45) * gDissolve;
    }

    float id = 1.0;

    // INTERIOR: the three glowing veins (project cards conceptually live here)
    float v = sdVein(p, 0.0, 0.35, -0.30);
    if (v < d) { d = v; id = 2.0; }
    v = sdVein(p, 2.1, -0.55, 0.32);
    if (v < d) { d = v; id = 3.0; }
    v = sdVein(p, 4.2, 1.25, 0.04);
    if (v < d) { d = v; id = 4.0; }

    // CORE: small glowing heart at the origin
    float dc = length(p) - gCoreR;
    if (dc < d) { d = dc; id = 5.0; }

    return vec2(d, id);
}

// ---------- emissive field (bounded volumetric glow along the ray) ---------
// Rational halos that SATURATE at the axis (max 0.05/vein) — unlike the old
// inverse-square form they can never integrate into a global white wash.
vec3 glowField(vec3 p) {
    float d1 = length(p.xz - vec2(-0.30, 0.06));
    float d2 = length(p.xz - vec2(0.32, -0.12));
    float d3 = length(p.xz - vec2(0.04, 0.24));
    vec3 g = LIME   * (0.018 * 0.014 / (0.014 + d1 * d1))
           + VIOLET * (0.018 * 0.014 / (0.014 + d2 * d2))
           + CYAN   * (0.018 * 0.014 / (0.014 + d3 * d3));
    return g * gVeinVis;
}

vec3 calcNormal(vec3 p) {
    const vec2 e = vec2(0.002, -0.002);
    return normalize(e.xyy * map(p + e.xyy).x +
                     e.yyx * map(p + e.yyx).x +
                     e.yxy * map(p + e.yxy).x +
                     e.xxx * map(p + e.xxx).x);
}

// ---------- background: void, nebula, stars --------------------------------
vec3 bg(vec3 rd) {
    float h = rd.y * 0.5 + 0.5;
    vec3 col = mix(vec3(0.012, 0.012, 0.020), vec3(0.020, 0.016, 0.036), h);
    float n = vnoise(rd * 2.5 + vec3(0.0, uTime * 0.01, 0.0)) * 0.6
            + vnoise(rd * 5.0 - 1.5) * 0.4;
    col += VIOLET * 0.030 * smoothstep(0.45, 0.85, n);
    col += CYAN   * 0.018 * smoothstep(0.55, 0.95, vnoise(rd * 3.7 - 2.0));
    return col;
}

float starLayer(vec3 rd, float scale) {
    vec3 p = rd * scale;
    vec3 id = floor(p);
    vec3 f = fract(p) - 0.5;
    float h = hash13(id);
    vec3 off = vec3(hash13(id + 11.0), hash13(id + 27.0), hash13(id + 43.0)) - 0.5;
    off *= 0.72;
    float d = length(f - off);
    float br = 1.0 - smoothstep(0.0, 0.45, d);
    br = br * br * br;
    float tw = 0.55 + 0.45 * sin(uTime * (1.5 + h * 3.0) + h * 50.0);
    return br * step(0.72, h) * (0.30 + 0.70 * h) * tw;
}

// drifting dust motes on planes at fixed distances (parallax-correct)
float dust(vec3 ro, vec3 rd) {
    float acc = 0.0;
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float di = 2.2 + fi * 2.6;
        vec3 p = ro + rd * di + vec3(uTime * 0.12, -uTime * 0.05, 0.0) * (0.5 + fi * 0.3);
        vec3 id = floor(p * 3.0);
        vec3 f = fract(p * 3.0) - 0.5;
        float h = hash13(id);
        vec3 off = vec3(hash13(id + 5.0), hash13(id + 9.0), hash13(id + 17.0)) - 0.5;
        off *= 0.8;
        float d = length(f - off);
        acc += (1.0 - smoothstep(0.0, 0.25, d)) * step(0.6, h) * (0.4 + 0.6 * h);
    }
    return acc;
}

// ---------- render one sample ----------------------------------------------
vec3 render(vec3 ro, vec3 fw, vec3 rt, vec3 up, vec2 fc) {
    float sc = clamp(uScroll, 0.0, 1.0);

    vec2 uv = (fc - 0.5 * uRes) / uRes.y;
    uv = rot2(gRoll) * uv;
    vec3 rd = normalize(fw + uv.x * rt + uv.y * up);

    // ----- raymarch (adaptive, <= 80 steps) -----
    float t = 0.0;
    float id = 0.0;
    bool hit = false;
    vec3 glow = vec3(0.0);
    float stepScale = 0.92 - 0.25 * gDissolve; // careful steps while dissolving

    for (int i = 0; i < 80; i++) {
        vec3 pos = ro + rd * t;
        vec2 h = map(pos);
        glow += glowField(pos) * clamp(h.x, 0.02, 0.4); // dt-weighted emission
        glow = min(glow, 0.35); // cap integrated glow — never a global wash
        float eps = 0.0012 * (1.0 + t * 0.6) + gDissolve * 0.012;
        if (h.x < eps) { id = h.y; hit = true; break; }
        t += h.x * stepScale;
        if (t > 34.0) break;
    }

    // ----- background with chromatic aberration on stars -----
    float r2 = dot(uv, uv);
    vec3 caDir = rt * (0.006 * r2);
    vec3 rdR = normalize(rd + caDir);
    vec3 rdB = normalize(rd - caDir);
    vec3 bgCol = bg(rd);
    float sG = starLayer(rd, 26.0) * 0.9 + starLayer(rd, 61.0) * 0.55;
    float sR = starLayer(rdR, 26.0) * 0.9 + starLayer(rdR, 61.0) * 0.55;
    float sB = starLayer(rdB, 26.0) * 0.9 + starLayer(rdB, 61.0) * 0.55;
    bgCol += vec3(sR, sG, sB) * 0.9;

    // ----- shade -----
    vec3 col;
    if (hit) {
        vec3 pos = ro + rd * t;
        vec3 n = calcNormal(pos);
        if (dot(n, rd) > 0.0) n = -n; // seen from inside the shell

        if (id == 1.0) {
            // obsidian glass — near-black inside so the veins carry the frame
            vec3 L = normalize(vec3(0.55, 0.75, 0.35));
            float dif = max(dot(n, L), 0.0);
            float spec = pow(max(dot(reflect(rd, n), L), 0.0), 70.0);
            float fre = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
            float inDark = 1.0 - 0.75 * gVeinVis; // interior shell darkening
            vec3 base = vec3(0.030, 0.032, 0.045) * inDark;
            vec3 tint = mix(VIOLET, CYAN, 0.5 + 0.5 * n.y) * 0.06 * inDark;
            vec3 refl = bg(reflect(rd, n)) * 0.6;          // one cheap fake reflection
            vec3 rdir = refract(rd, n, 0.94);              // refraction hint
            vec3 hint = glowField(pos + rdir * 0.5) * 1.2;
            col = base * (0.25 + 0.75 * dif)
                + spec * vec3(0.90, 1.00, 0.80) * 0.35
                + fre * (refl * 0.45 + tint + hint * 0.22);
            // DISSOLVE: shell turns translucent, dissolving into the void
            col = mix(col, bgCol + hint * 0.4, gDissolve * 0.75);
        } else if (id >= 2.0 && id <= 4.0) {
            // INTERIOR: emissive veins — localized neon lines on dark ground
            vec3 vc = (id == 2.0) ? LIME : ((id == 3.0) ? VIOLET : CYAN);
            col = vc * (1.3 + 0.4 * sin(uTime * 2.0 + id * 2.1)) * mix(0.4, 1.0, gVeinVis);
        } else {
            // CORE: small bright heart; halo handled analytically after shading
            col = mix(vec3(1.0), LIME, 0.3) * 1.1 * (0.3 + gCoreR);
        }

        // distance fog toward the void
        col = mix(col, bgCol, 1.0 - exp(-0.018 * t));
        // soften the frame where we pierce the shell (INTERIOR entry)
        col = mix(bgCol, col, smoothstep(0.02, 0.14, t));
    } else {
        col = bgCol;
    }

    // ----- CONTACT: analytic core halo (bounded r^6, no volumetric wash) -----
    // Closest approach of the ray to the origin (core center), from ro+rd*t.
    float tc = clamp(dot(-ro, rd), 0.0, 34.0);
    float b = length(ro + rd * tc); // ray-miss distance to the core center
    float coreVis = smoothstep(0.72, 0.94, sc);
    float halo = coreVis * 0.35 * (gCoreR * gCoreR) / (gCoreR * gCoreR + b * b * b * b * b * b);
    col += mix(vec3(1.0), LIME, 0.35) * halo;

    // ----- drifting particles: HERO far dust + EXPERIENCE dissolving cloud -----
    // CONTACT (p=1) keeps a light ambient dust so the frame stays alive.
    float dustDensity = 0.10
        + 0.85 * (1.0 - smoothstep(0.06, 0.20, sc))                                  // HERO
        + 0.55 * smoothstep(0.60, 0.72, sc) * (1.0 - smoothstep(0.88, 0.97, sc));    // EXPERIENCE
    vec3 dustTint = mix(vec3(0.50, 0.80, 0.75), mix(LIME, VIOLET, 0.5), smoothstep(0.60, 0.75, sc));
    col += dustTint * dust(ro, rd) * dustDensity * 0.42;

    // ----- volumetric glow (veins / core light shafts) -----
    col += glow * 0.13;

    // ----- WORK entry flash when crossing the shell (~0.42) -----
    float fx = (sc - 0.42) * 16.0;
    col += vec3(0.70, 1.00, 0.85) * 0.30 * exp(-fx * fx);

    return col;
}

// ---------- main -----------------------------------------------------------
void main() {
    vec2 fc = gl_FragCoord.xy;
    float sc = clamp(uScroll, 0.0, 1.0);

    // per-frame scene parameters
    gDissolve = smoothstep(0.60, 0.80, sc);                                   // EXPERIENCE
    gVeinVis  = mix(0.12, 1.0, smoothstep(0.18, 0.40, sc));                   // WORK boost
    gVeinVis *= mix(1.0, 0.30, smoothstep(0.72, 0.90, sc));                   // fade for CONTACT
    gCoreR     = mix(0.13, 0.055, smoothstep(0.72, 0.94, sc));                // CONTACT: shrink core
    gBob  = 0.10 * sin(uTime * 0.45);
    gYaw  = 0.10 * sin(uTime * 0.08);
    gRoll = 0.05 * sin(uTime * 0.13) + uMouse.x * 0.06;

    // ----- camera path (monotonic approach along -z) -----
    float z = mix(18.0, 6.50, smoothstep(0.00, 0.15, sc));  // HERO      : distant shard
    z        = mix(z,   1.60, smoothstep(0.15, 0.35, sc));  // ABOUT     : fly in, close pass
    z        = mix(z,   0.55, smoothstep(0.35, 0.45, sc));  // WORK      : pierce shell (~0.42)
    z        = mix(z,   0.42, smoothstep(0.60, 0.80, sc));  // EXPERIENCE: drift while it breaks
    z        = mix(z,   0.60, smoothstep(0.82, 1.00, sc));  // CONTACT   : behold the small core
    float yPath = mix(1.9, 0.0, smoothstep(0.03, 0.42, sc));
    vec3 ro = vec3(0.0, yPath + 0.06 * sin(uTime * 0.35 + sc * 9.0), z);
    ro.x = 0.25 * sin(sc * 6.2831) * (1.0 - smoothstep(0.40, 0.70, sc)); // gentle lateral sweep

    vec3 ta = ro + vec3(0.0, 0.0, -3.0);
    float lookMono = 1.0 - smoothstep(0.00, 0.20, sc);      // HERO/ABOUT: aim at the shard
    ta = mix(ta, vec3(0.0, 0.0, 0.0), lookMono * 0.85);
    ta = mix(ta, vec3(0.0, 0.0, 0.0), smoothstep(0.80, 1.0, sc)); // CONTACT pull
    float par = 0.5 * (1.0 - 0.6 * smoothstep(0.40, 0.70, sc));   // mouse parallax (damped inside)
    ta.xy += uMouse * vec2(par, -par * 0.6);
    ro.xy += uMouse * 0.10;

    // camera basis
    vec3 fw = normalize(ta - ro);
    vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(rt, fw);

    // ----- 2-sample rotated-grid AA -----
    vec3 col = render(ro, fw, rt, up, fc + vec2( 0.25,  0.25))
             + render(ro, fw, rt, up, fc + vec2(-0.25, -0.25));
    col *= 0.5;
    // interior segments need less exposure: bright surfaces fill the frame there
    float exposure = 1.1 * (1.0 - 0.62 * smoothstep(0.35, 0.55, sc)) * (1.0 - 0.55 * smoothstep(0.82, 1.0, sc));
    col *= 0.5 * exposure;

    // ----- post: tonemap, vignette, grain, intro -----
    col = clamp((col * (2.51 * col + 0.03)) /
                (col * (2.43 * col + 0.59) + 0.14), 0.0, 1.0); // ACES-ish
    col = pow(col, vec3(0.4545)); // gamma

    vec2 vuv = (fc - 0.5 * uRes) / uRes.y;
    float vig = pow(max(1.0 - 0.42 * dot(vuv, vuv), 0.0), 1.4);
    col *= vig;

    float gr = hash13(vec3(fc * 0.73, fract(uTime) * 61.0));
    col += (gr - 0.5) * 0.045; // film grain

    col *= uIntro; // intro fade-in
    fragColor = vec4(col, 1.0);
}
