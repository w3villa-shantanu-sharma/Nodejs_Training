const db = require('./DB/dbconfig');

(async () => {
    try {
        const [rows] = await db.query('SELECT 1');
        console.log('Database connection successful:', rows);
    } catch (err) {
        console.error('Database connection failed:', err.message);
    }
})();