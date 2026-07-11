module.exports = {
  apps: [
    {
      name: "aisolution-blog",
      script: ".next/standalone/server.js",
      cwd: "/var/www/blog",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
        HOSTNAME: "127.0.0.1"
      },
      max_memory_restart: "400M",
      instances: 1,
      exec_mode: "fork"
    }
  ]
};
