
let users = [
    {
        id:1,
        name : "Villa",
        age : 25,
        email : "vill@gmail.com"
    },
    {
        id:1,
        name : "Bob",
        age : 20,
        email : "vill@gmail.com"
    }
];

// GET /api/users?age=25

exports.getUsers = async(req , res) =>{
    const {age , sort} = req.query;
    let result = users;

    if(age){
        result = users.filter((user)=>user.age == age); 
    }


    res.json(result);
}

// GET /api/users/:id

exports.getUsersbyId = async(req,res)=>{
    const {id} = req.params;
    const user = users.find((u)=>u.id == id);

    if(!user){
        return res.status(404).json({error : "User not found"});
    }
    res.json(user);
};


// POST /api/users

exports.createUser = async(req , res) =>{
    const {name , email , age} = req.body;

    if(!name || !email || !age){
        return res.status(400).json({message : "Name and email and age is required."})
    }

    const newUser = {
        id:users.length+1,
        name,
        age,
        email
    }

    users.push(newUser);

    res.status(200).json({message: "User created " , name  , email , age})
}


exports.updateUsers = async(req ,res) =>{
    const {id} = req.params;
    const { name  , email , age} = req.body;

    const user = users.find((u)=> u.id == id);

    if(!user){
        return res.status(404).json({message: "User not found"});
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.age = age || user.age;

    res.json(user);
}

