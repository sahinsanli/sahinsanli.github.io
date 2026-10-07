/* shader-loader.js — fetch shader source, expose to harness */
window.SHADER_SRC = null;
window.loadShader = function (url) {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error('shader fetch ' + r.status);
    return r.text();
  });
};
