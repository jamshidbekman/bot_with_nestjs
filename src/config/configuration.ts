const configuration = () => {
  return {
    PORT: process.env.PORT,
    DB_URL: process.env.DB_URL,
    DB_NAME: process.env.DB_NAME,
    BOT_TOKEN: process.env.BOT_TOKEN,
    ADMIN_ID: process.env.ADMIN_ID,
  };
};

export default configuration;
