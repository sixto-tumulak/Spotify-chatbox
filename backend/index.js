const mysql = require('mysql2')
const bcrypt = require('bcrypt')
const express = require('express')
const jwt = require('jsonwebtoken');
const router = express.Router();
const port = 3000
const app = express()
const cors = require('cors')


app.use(express.json())
app.use(cors())
const saltrounds = 10;

app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`)
})
const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database: 'spotify'
})

connection.connect(err=>{
    if(err) {
            console.log('Error Communicating', err)
    }
    else 
{
    console.log('Success')
}
})

app.post('/register',(req,res)=>{
   const {email,password} = req.body

   bcrypt.hash(password,10,(err,hash)=>{
    if(err) {
        res.json({message:'Error hashing password', err})
    }
    else {
        connection.query('insert into users (email,password) values (?,?)',[email,hash],(err,results)=>{
            if(err) {
                res.json({message:'error',err})
            }else {
                res.json({message:'Success'})
            }
        })
    }
   })
})
app.get('/users', async (req,res)=>{
    connection.query('select * from users',(err,results)=>{
        if(err){
            res.json({message:'Error retrieving users',err})
        }else{
            res.json(results)
        }
    })
})

app.post('/login',(req,res)=>{
    const {email,password} = req.body

    connection.query('select * from users where email = ?',[email],async (err,results)=>{
        if(err) {
            console.log('Error Retrieving data',err)
            return res.status(500).json({error:'Internal Server Error'})
        }

        if(results.length===0 ) {
            return res.status(401).json({error:'Invalid Credentials'})
        }

        const user = results[0]

        const passwordMatch = await bcrypt.compare(password, user.password)
        if(!passwordMatch) {
            return res.status(401).json({error:'Invaliid Credentials'})
        }

        const token = jwt.sign({userId:user.id, email:user.email},'secret_key')

        res.json({token})
    })
})

app.post('/logout', (req, res) => {
    const token = req.body.token;
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
  
    try {
      const decoded = jwt.verify(token, 'secret_key');
      const userId = decoded.userId;
  
      const expiredToken = jwt.sign({ userId }, 'secret_key', { expiresIn: '1s' });
  
      res.json({ message: 'Logged out successfully', expiredToken });
    } catch (error) {
      res.status(400).json({ error: 'Invalid token' });
    }
  });