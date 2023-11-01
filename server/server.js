const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");

//const jwt = require('jsonwebtoken');
const secret = 'very-secret-key';
const {createSigner, createVerifier} = require('fast-jwt');
const sign = createSigner({key: secret});
const verify = createVerifier({key: secret});

const bcrypt = require('bcrypt');
const saltRounds = 10;

const mysqldb = require('./mysqldb.js');
const getCurrentTime = mysqldb.getCurrentTime;
const execQuery = mysqldb.execQuery;


const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ["GET", "POST"]
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const server = http.createServer(app);

const io = new Server(server, {
    cors: corsOptions
});

const getUser = (token, res) => {
    try{
        return verify(token, secret);
    } catch(e) {
        console.error("Failed to verify token: ", e);
        res.sendStatus(500);
    }
}

const userIsAdmin = async(token, idConversation) => {
    const user = getUser(token);
    const query = `SELECT admin FROM chat.userconversation WHERE idUser = ? AND idConversation = ?`
    const result = await execQuery(query, [user.idUser, idConversation]);
    return result[0].admin;
}

const userIsOwner = async(token, idConversation) => {
    const user = getUser(token);
    const query = `SELECT idCreator FROM chat.conversation WHERE idConversation = ?`;
    const result = await execQuery(query, [idConversation]);
    return user.idUser === result[0].idCreator;
}

//de adaugat logica pentru socket leave

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);
  
    socket.on('joinRoom', (roomName) => {
        if(!socket.rooms.has(roomName)){
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined room ${roomName}`);
        }
    });
  
    socket.on("sendMessage", (data) => {
        console.log("sending data to ", data.idConversation);
        data.idUser = verify(data.token, secret).idUser;
        socket.to(data.idConversation).emit("receiveMessage", data);
    });
});


app.get("/api/servertime", (req, res)=> {
    res.json(getCurrentTime())
})

app.get("/api/gets/allusernames", async(req, res) => {
    const query = `SELECT username FROM chat.user`
    try{
        const results = await execQuery(query);
        const usernames = results.map(x => x.username)
        res.json(usernames);
    } catch(error){
        console.error('Database error (getallusernames): ', error);
        res.sendStatus(500);
    }
})

app.get("/api/gets/idusername", async(req, res) => {
    const query = `SELECT idUser, username FROM chat.user`
    try {
        const results = await execQuery(query);
        const idUsername = new Map();
        results.forEach((row) => {
            idUsername.set(row.idUser, row.username);
        })
        res.json(Object.fromEntries(idUsername))
    } catch(error){
        console.error('Database error (idusername): ', error);
        res.sendStatus(500);
    }
})

app.get('/api/gets/associatedchats/:userId', async(req, res) => {
    const userId = req.params.userId;
    const chatsQuery =  `SELECT chat.conversation.idConversation, title, idCreator, createdTime, admin 
                    FROM chat.conversation JOIN chat.userconversation on chat.conversation.idConversation = chat.userconversation.idConversation 
                    WHERE idUser = ?`;

    const messageQuery = `SELECT * FROM chat.message WHERE idConversation = ?`;

    try{
        const chatsResults = await execQuery(chatsQuery, [userId]);
        
        const chats = await Promise.all(chatsResults.map(async(row) => {
            const messageResults = await execQuery(messageQuery, [row.idConversation]);
            const messages = messageResults.map((row) => {
                return {
                    idUser: row.idUser,
                    content: row.content,
                    timeSent: row.timeSent
                }
            })
            return {
                idConversation: row.idConversation,
                title: row.title,
                idCreator: row.idCreator,
                createdTime: row.createdTime,
                admin: row.admin,
                messages
            }
        }));

        res.json(chats);
    } catch(error){
        console.error(`Database error (associatedchats/${userId}): `, error);
        res.sendStatus(500);
    }

})

app.post("/api/posts/user", async(req, res) => {
    const {token} = req.body;
    try {
        const payload = verify(token, secret);
        res.status(200).json(payload);
    } catch (error) {
        console.error('Error decoding token:', error.message);
        res.sendStatus(500);
    }
})

app.post("/api/posts/message", async(req, res) => {
    const {idConversation, token, content, timeSent} = req.body;
    const idUser = verify(token, secret).idUser;
    //todo verificare mesaj?

    const query = `INSERT INTO chat.message (idConversation, idUser, content, timeSent) VALUES (?, ?, ?, ?)`
    try{
        await execQuery(query, [idConversation, idUser, content, timeSent]);
        res.sendStatus(200);
    } catch(error){
        console.error('Database Error (message): ', error);
        res.sendStatus(500);
    }
})

app.post("/api/posts/registeruser", (req, res) => {
    const { username, email, password } = req.body;
    if(username.length < 6 || !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) || password.length < 6){
        res.sendStatus(500);
    } else {
        bcrypt.genSalt(saltRounds, (err, salt) => {  
            bcrypt.hash(password, salt, async (err, hash) => {
                const query = `INSERT INTO chat.user (email, password, username) VALUES (?, ?, ?)`;
                try{
                    await execQuery(query, [email, hash, username]);
                    console.log('User registered succesfully');
                    res.sendStatus(200);
                } catch (error){
                    console.error('Database Error (register): ', error);
                    res.sendStatus(500);
                }
            });
        });
    }
})

app.post("/api/posts/login", async(req, res) => {
    const { email, password } = req.body;

    const query = `SELECT * FROM chat.user WHERE email = ?`;

    try{
        const results = await execQuery(query, [email]);
        if (results.length === 0) {
            // User not found
            console.log('Tried to login with invalid email');
            res.status(401).json({ error: 'Invalid credentials' });
        } else {
            bcrypt.compare(password, results[0].password, function(err, result) {
                if (result) {
                    // log in success
                    const token = sign({ username: results[0].username, idUser: results[0].idUser }, secret, { expiresIn: '1h' });
                    res.status(200).json({token})
                }
                else {
                    // access denied
                    console.log('Tried to login with invalid password');
                    res.status(401).json({ error: 'Invalid credentials' });
                }
            });
        }
    } catch(error){
        console.error('Database Error (login): ', error);
        res.sendStatus(500);
    }
})

app.post("/api/posts/newchat", async(req, res) => {
    const {loggedUser, title, participantList} = req.body;

    console.log(loggedUser)
    const chatInsertQuery = `INSERT INTO chat.conversation (title, idCreator, createdTime) VALUES (?, ?, ?)`
    const insertUserConversationQuery = `INSERT INTO chat.userconversation (idUser, idConversation, admin) VALUES (?, ?, ?)`
    const getIdUserQuery = `SELECT idUser FROM chat.user WHERE username = ?`

    try{
        //Inserting into chat.conversation
        resultsChatInsert = await execQuery(chatInsertQuery, [title, loggedUser.idUser, getCurrentTime()]);
        const conversationId = resultsChatInsert.insertId;

        //Inserting into chat.userconversation only 1 row for the creator of the chat
        await execQuery(insertUserConversationQuery, [loggedUser.idUser, conversationId, true])

        //For every participant a new row has to be inserted in chat.userconversation
        for(let participant of participantList){
            //Get the ID of the participant (since we only have the username)
            const resultsGetId = await execQuery(getIdUserQuery, [participant]);
            if (resultsGetId.length === 0 ){
                res.sendStatus(401);
            } else {
                //Insert the row in chat.userconversation
                await execQuery(insertUserConversationQuery, [resultsGetId[0].idUser, conversationId, false])
            }
        }
        res.sendStatus(200);
    } catch(error){
        console.error('Database Error (newchat): ', error);
        res.sendStatus(500);
    }

})

app.post("/api/posts/chatmembers", async(req, res) => {
    const {token, channel} = req.body;
    const username = getUser(token, res).username;
    let personal = 0;
    const query = `SELECT admin, username, a.idUser FROM chat.userconversation as a JOIN chat.user as b ON a.idUser = b.idUser WHERE idConversation = ?`

    const results = await execQuery(query, channel);
    for(let result of results){
        if(result.username === username){
            personal = {
                idUser: result.idUser,
                admin: result.admin,
                username: result.username
            };
        }
    }

    if(personal === 0){
        res.sendStatus(500);
    } else {
        const trueResults = results.map((result) => {
            return {
                idUser: result.idUser,
                admin: result.admin,
                username: result.username
            }
        })
        const finalResults = {
            memberList: trueResults,
            personal: personal
        }
        res.json(finalResults);
    }

})

app.post("/api/posts/toggleadmin", async(req,res) => {
    const {idUser, idConversation, token} = req.body;
    //security, checking for owner privilege
    const user = getUser(token);
    if(!userIsOwner(token, idConversation)){
        res.sendStatus(403);
    } else {
        const query = `UPDATE chat.userconversation SET admin = !admin WHERE idUser = ? AND idConversation = ?`
        try{
            await execQuery(query, [idUser, idConversation]);
            res.sendStatus(200);
        } catch(e){
            console.error('Database Error (toggleadmin): ', e);
            res.sendStatus(500);
        }
    }
})

app.post("/api/posts/kick", async(req, res) => {
    const {idUser, idConversation, token} = req.body;
    //security, checking for admin privilege
    if(!userIsAdmin(token, idConversation)){
        res.sendStatus(403);
    } else {
        const query = `DELETE FROM chat.userconversation WHERE idUser = ? AND idConversation = ?`;
        try{
            await execQuery(query, [idUser, idConversation]);
            res.sendStatus(200);
        } catch(e){
            console.error('Database Error (kick): ', e);
            res.sendStatus(500);
        }
    }
})

app.post("/api/posts/addmember", async(req, res) => {
    const {username, idConversation, token} = req.body;
    //security, checking for admin privilege
    if(!userIsAdmin(token, idConversation)){
        res.sendStatus(403);
    } else {
        const queryFindId = `SELECT idUser FROM chat.user WHERE username = ?`;
        const result = await execQuery(queryFindId, [username]);
        if(result.length === 0){
            res.sendStatus(401);
        } else {
            const idUser = result[0].idUser;
            const query = `INSERT INTO chat.userconversation (idUser, idConversation, admin) VALUES (?, ?, 0)`
            await execQuery(query, [idUser, idConversation]);
            res.json(idUser);
        }
    }
})

server.listen(5000, () => {console.log("Server started on port 5000");});