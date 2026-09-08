module.exports = {
  apps: [
    {
      name: 'comandy-backend',
      script: './src/server.js',
      cwd: __dirname,

      // Cluster mode: aprovecha todos los cores del VPS. Si en algun momento
      // da problemas con las rooms de Socket.io entre procesos, bajar a 1
      // instancia (fork mode) o sumar el adapter de Redis para socket.io.
      instances: 1,
      exec_mode: 'fork',

      autorestart: true,
      watch: false,
      max_memory_restart: '300M',

      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },

      // Logs separados de los de la app (winston ya escribe en LOG_DIR);
      // estos son el stdout/stderr crudo del proceso, utiles para crashes
      // que pasan antes de que winston llegue a inicializarse.
      error_file: '/var/log/comandy/pm2-error.log',
      out_file: '/var/log/comandy/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Si el proceso muere en menos de 10s despues de arrancar, algo esta
      // mal (ej. no conecta a la DB) y PM2 no debe entrar en loop infinito.
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],
};
