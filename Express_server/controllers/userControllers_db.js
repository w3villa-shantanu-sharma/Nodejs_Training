const User = require('../models/userModel');

exports.getUsers = async(req , res)=>{
    const users = await User.getAllUsers();
    res.json(users);

}

exports.createUser = async(req, res) =>{
    const {name , email ,age , password} = req.body;

    if(!name || !email || !age ){
        return res.status(400).json({error : "Name  , Email and Age is required"});
        
    }


    await User.createUser(name , email , age , password);
    res.status(201).json({message : "User Created Successfully " , name , email , age});
};

// GET /api/users?age=25
exports.getUsers = async (req, res) => {
    const { age} = req.query;
  
    const users = await User.findAllUsers(age);
    res.json(users);
  };
  
  // GET /api/users/:id
  exports.getUsersbyId = async (req, res) => {
    const { id } = req.params;
  
    const user = await User.findUserById(id);
  
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
  
    res.json(user);
  };
