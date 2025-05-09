require('dotenv').config();
const express = require('express');
const userRouter = require('./routes/userRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware')


const app = express();

const Port = 4000;  

app.use(express.json());

//Middleware 1: Log request method and url

app.use((req ,res , next) =>{
    console.log(`${req.method} request to ${req.url}`);
    next();
    
})

app.use('/api/users' , userRouter);

app.use(errorMiddleware);

// app.get('/' , (req , res) =>{
//     res.status(200);
//     res.send("Welcome to the root url of server");
// })

// app.post('/' , function(req , res){
//     res.send("This is  a post request!!");

// })

// app.get('/hello' , (req , res) =>{
//     res.set('Content-Type' , 'text/html');
//     res.status(200).send("<h1>Welcome to the Site</h1>");
// });

// const someFailingAsyncFunction = async () => {
//     return{
//         "name" : "John",
//         "age" : "21"
//     };
//     throw new Error('Database connection failed');
//   };

// app.get('/' , (req ,res)=>{
//     console.log("Default error handling");
//     throw new Error("Something went wrong!");
// });

// app.get('/' , (req , res) =>{
//     res.status(200);
//     res.send("Welcome to the root url of server");
// })
//Custom error-handling middleware
// app.use((err , req  ,res , next) =>{
//     console.log(err);
//     res.status(500).json({message : "Oops !  something went wrong," });
    
// });

// app.get('/errors'  ,async(req ,res)=>{
//     try {
//         const data = await someFailingAsyncFunction(); /// this throws error
//         res.send(data); // this line never reached
//     } catch (error) {
//         res.status(500).json({message : "Something went wrong ", error:error.message});
        
//     }
  
// });

app.listen(Port , (error) =>{
    if(!error){
        console.log("Server is running on this port : " + Port );
        
    }else{
        console.log("Error occured  , server can't start" , error);
        
    }
});