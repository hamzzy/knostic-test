const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    maxFiles: parseInt(process.env.MAX_FILES) || 5,
    allowedMimeTypes: ['text/csv', 'application/csv']
  },
  csv: {
    delimiter: ',',
    quote: '"',
    escape: '"',
    writeHeaders: true
  },
  validation: {
    requiredHeaders: ['Topic', 'SubTopic', 'Industry']
  }
};

module.exports = config;
