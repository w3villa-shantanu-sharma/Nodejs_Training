

exports.getUsers = (req , res) =>{
    const {age , sort} =  req.query;

    const users = [
        {
            name : "Villa",
            age : 25
        },
        {
            name : "bob",
            age : 20
        }
    ];

    let filtered = users;

    if(age){
        filtered = users.filter(user=>user.age == age);

    }
    res.json(filtered);
}

exports.getUsersbyId = (req , res) =>{
    const {id} = req.params;
    res.send(`User Id is ${id}`)
}

exports.createUser = (req , res) =>{
    const {name , email} = req.body;

    if(!name || !email){
        return res.status(400).json({error : `Name is required`});
        }
    
    res.status(200).json({message: "User created"  , name , email});
};