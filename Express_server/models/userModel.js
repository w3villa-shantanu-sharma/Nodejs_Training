const db = require('../DB/dbconfig');

// GET /api/users?age=25
exports.getAllUsers = async() =>{
    const [rows] =  await db.query('SELECT * FROM users');
    return rows;
};

// exports.getUsersbyId = async() =>{

// }

exports.createUser = async(name , email , age , password) =>{
    const [query_res] = await db.query('INSERT INTO users (name , email , age , password) VALUES (? , ? , ? , ?)',[name , email , age , password]);
    return query_res;

}

exports.getUsers = async(age) =>{
    let query = 'SELECT * FROM users'
    const values = [];

    if(age){
        query += 'WHERE age = ?';
        values.push(age);
    }

    const [rows] = await db.query(query , values);
    return rows;

};

exports.findUserById = async(id)=>{
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?' , [id]);
    return rows[0];
};


