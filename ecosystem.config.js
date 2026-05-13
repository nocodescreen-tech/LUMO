module.exports = {
  apps: [
    {
      name: 'lumo-backend',
      script: './server/server.js',
      instances: 'max', // Utilise tous les coeurs CPU disponibles (Mode Cluster)
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './server/logs/pm2-error.log',
      out_file: './server/logs/pm2-out.log',
      merge_logs: true
    }
  ]
};
