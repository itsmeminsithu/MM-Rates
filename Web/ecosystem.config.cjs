module.exports = {
  apps: [{
    name: "mm-rates-api",
    script: "src/server.js",
    cwd: __dirname,
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    watch: false,
    max_memory_restart: "350M",
    time: true,
    env: { NODE_ENV: "production", TRUST_PROXY: "true" },
  }],
};
