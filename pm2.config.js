const NAME = "STATIC_FILES";

const apps = [
    {
        name: NAME,
        script: "./index.js",
        instances: 1,
        max_memory_restart: "1G",
        ignore_watch: ["node_modules", "log/**", "public/**", "page/**"],
        exec_mode: "fork",
        out_file: `./log/pm2/pm2.log`,
        error_file: `./log/pm2/pm2err.log`,
        log_date_format: "YYYY-MM-DD HH:mm:ss.SSS",
        merge_logs: false,
        env: {
            NODE_ENV: "production"
        },
        env_dev: {
            NODE_ENV: "dev"
        }
    }
];

module.exports = { apps };