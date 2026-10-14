function getEnv(name, defaultValue) {
    return process.env[name] ?? defaultValue;
}

module.exports = {
    PORT: Number(getEnv('PORT', 3000)),
    DATABASE_URL: getEnv('DATABASE_URL', ''),
    DB_SSL: getEnv('DB_SSL', 'false')
};
