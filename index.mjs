// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, push, child, update, remove } from "firebase/database";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { nanoid } from 'nanoid';
import crypto from "crypto";
import bcrypt from "bcrypt";

import express from "express";

import * as dotenv from 'dotenv';
dotenv.config();

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const port = process.env.PORT || 4002;

const server = express();

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
const auth = getAuth(app);

const sha256 = (input) => {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}

const createUserId = () => {
    const nanoidId = nanoid();
    return sha256(nanoidId);
}

const setReference = (pathreference = '' || undefined) => ref(db, pathreference);

const hashPasswordWithBcrypt = (passwordPlaintext) => {
    const saltRounds = 10;
    return new Promise((resolve, reject) => {
        bcrypt.hash(passwordPlaintext, saltRounds, (err, hash) => {
            if (hash) {
                resolve(hash)
            } else {
                reject(err)
            }
        });
    })
}

const verifyUserPassword = (password, passwordHash) => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, passwordHash, (err, result) => {
            resolve(result);
        });
    })
}

const checkUserExists = (email) => {
    const emailHash = sha256(email.toLowerCase());
    const dbref = setReference();
    return new Promise((resolve, reject) => {

        get(child(dbref, "Users/" + emailHash))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const user = snapshot.val();
                    console.log('user exists');
                    resolve(user)
                } else {
                    console.log('user does not exist');
                    resolve(false)
                }
            })
            .catch((error) => {
                console.log(error)
            })
    })
}

async function registerUserWithEmailAndPassword(email, password) {
    const userExist = await checkUserExists(email);
    return new Promise(async (resolve, reject) => {

        if (!userExist) {
            const userId = createUserId();
            const ref = setReference('Users/' + sha256(email.toLowerCase()));
            const user = {
                uid: userId,
                email,
                password: await hashPasswordWithBcrypt(password)
            }
            set(ref, user)
                .then(() => {
                    console.log(`succesfully added!`)
                    resolve('user added')
                })
                .catch((error) => {
                    console.log(error);
                });
        } else {
            resolve('user already exists')
        }

    })



}

const getTimestamp = () => {
    //timestamp in milliseconds 
    const ts = Date.now();

    return Math.floor(ts / 1000)//return timestamp in seconds
}

const getUser = (email) => {
    const dbref = setReference();
    const emailHash = sha256(email.toLowerCase());

    return new Promise((resolve, reject) => {
        get(child(dbref, "Users/" + emailHash))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const user = snapshot.val();
                    resolve(user)
                } else {
                    resolve({
                        message: 'user not found'
                    })
                }
            })
            .catch((error) => {
                console.log(error)
            })

    })

}

const updateUser = async (email, newData) => {
    const dbref = setReference();
    const emailHash = sha256(email.toLowerCase());

    return new Promise((resolve, reject) => {
        update(child(dbref, "Users/" + emailHash), newData)
            .then(() => {
                resolve('user data updated')
            })
            .catch((error) => {
                console.log(error);
                reject(error);
            })

    })

}

const addDigitalizedDocumentToUser = async (email, docId) => {
    return await new Promise(async (resolve, reject) => {
        const user = await getUser(email);
        const document = {
            docId,
            creationDate: getTimestamp(),
            anchorKey: `${user.uid}_${docId}`
        }
        if (user && user.documents && user.documents.length != 0) {
            user.documents.push(document);
            //here we update the user in database
            const result = await updateUser(user.email, user);

            resolve({
                message: result,
                user
            });

        } else if (user && !user.documents) {
            user.documents = [];
            user.documents.push(document);
            //here we update the user in database
            const result = await updateUser(user.email, user);

            resolve({
                message: result,
                user
            });

        } else {
            reject({
                message: 'something went wrong'
            });
        }
    }).catch((error) => {
        console.log(error);
    })


}

const loginUser = async (email, password) => {
    const user = await getUser(email);
    const passwordVerified = await verifyUserPassword(password, user.password);
    if (user && passwordVerified) {
        return 'user logged in';
    } else {
        return 'unable to login please check your credentials';
    }

}

server.use(express.json());

server.get('/', (req, res) => {
    res.send('Welcome to docdigitalizor database service registry service!')
})

server.get('/users/:email/uid', async (req, res) => {
    const email = req.params.email;
    if (user) {
        res.status(200).send(user.uid);
    } else {
        res.status(404).send({
            message: `User with email ${email} not found`,
        });
    }
})

server.post('/register', async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const result = await registerUserWithEmailAndPassword(email, password);
        if (result && result === 'user added') {
            res.status(200);
            res.send({
                message: result
            })
        } else {
            res.status(500);
            res.send({
                message: result
            });
        }
    } catch (error) {
        next(error);
    }
})

server.post('/users/firebase', async (req, res, next) => {
    const { email, password } = req.body;
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log(userCredential.user);
            res.status(201);
            res.json({
                message: 'user added!'
            })
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            //console.log(errorCode);
            //console.log(errorMessage);
            res.status(500);
            res.json({
                errorCode,
                errorMessage
            })
        });
})

server.post('/users/firebase/login', async (req, res, next) => {
    const { email, password } = req.body;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const { uid, email } = userCredential.user;
            console.log(userCredential.user);
            res.status(201);
            res.json({
                message: 'user authenticated',
                uid,
                email
            })
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            //console.log(errorCode);
            //console.log(errorMessage);
            res.status(500);
            res.json({
                errorCode,
                errorMessage
            })
        });  
})

server.put('/users/:email/documents', async (req, res, next) => {
    const email = req.params.email;
    const { documentId } = req.body;
    try {
        const userData = await addDigitalizedDocumentToUser(email, documentId);
        res.status(200).send({
            message: 'User document added!',
            userData
        })
    } catch (error) {
        next(error);
    }
})

// Error handling middleware
server.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Process event listeners
process.on('uncaughtException', function (err) {
    console.error('Uncaught Exception:', err.stack);
});

process.on('unhandledRejection', function (reason, promise) {
    console.error('Unhandled Rejection:', reason.stack || reason);
});

server.listen(port, () => {
    console.log(`docdigitalizordb service listening at http://localhost:${port}`);
});
