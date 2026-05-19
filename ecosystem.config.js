module.exports = {
  apps : [{
    name: "gig-api",
    script: "./server.js",
    env: {
      NODE_ENV: "production",
    },
    exp_backoff_restart_delay: 100,
    max_memory_restart: "400M",
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm Z"
  }]
}