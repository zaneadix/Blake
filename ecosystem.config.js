module.exports = {
  apps: [
    {
      name: 'Blake',
      script: 'index.js',
      error_file: 'logs/pm2_err.log',
      out_file: 'logs/pm2_out.log',
      time: true,
    },
  ],
};
