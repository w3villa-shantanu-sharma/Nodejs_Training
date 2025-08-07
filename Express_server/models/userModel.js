import db from '../DB/dbconfig.js';

// GET /api/users?age=25
export const getAllUsers = async() => {
    const [rows] = await db.query('SELECT * FROM users');
    return rows;
};

export const createUser = async(name, email, age, password) => {
    const [query_res] = await db.query('INSERT INTO users (name , email , age , password) VALUES (? , ? , ? , ?)', [name, email, age, password]);
    return query_res;
};

export const getUsers = async(age) => {
    let query = 'SELECT * FROM users';
    const values = [];

    if(age){
        query += ' WHERE age = ?';
        values.push(age);
    }

    const [rows] = await db.query(query, values);
    return rows;
};

export const findUserById = async(id) => {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
};


