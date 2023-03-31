// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, push, child, update, remove } from "firebase/database";
//import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { nanoid } from 'nanoid'
import crypto from "crypto";
import bcrypt from "bcrypt";

import * as dotenv from 'dotenv';
dotenv.config();

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const db = getDatabase(app);
//const auth = getAuth(app);

    const sha256 = (input) => {
        const hash = crypto.createHash('sha256');
        hash.update(input);
        return hash.digest('hex');
    }

const createUserId = () => {
   const nanoidId = nanoid();
   return sha256(nanoidId);   
}  
const setReference = (pathreference) => ref(db, pathreference);

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

const emailExists = (email) => {

}
/*
const registerUserWithEmailAndPassword = (email, password) => {
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;
        console.log("user added",user);
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
      });
}
*/

const checkUserExists = (email) => {
    const emailHash = sha256(email);

    get(ref(db, 'testfoo'))
    .then((snapshot)=>{
        console.log(snapshot.val());
    })
    .catch((error)=>{
        console.log(error);
    });



}

async function registerUserWithEmailAndPassword(email, password){
    //TODO check if a user already exists before proceeding
    const userId = createUserId();
    const ref = setReference('mynewlist/'+sha256(email.toLowerCase()));
    const user = {
        uid:userId,
        email,
        password:await hashPasswordWithBcrypt(password)
    }
    set(ref,user)
    .then(()=>{
        console.log(`succesfully added!`)
    })
    .catch((error)=>{
        console.log(error);
    });
    }

function FindData() {
           // const dbref = ref(db);

            get(ref(db, 'testfoo'))
                .then((snapshot)=>{
                    console.log(snapshot.val());
                })
                .catch((error)=>{
                    console.log(error);
                });
            }

//FindData();

function UpdateData(){
            update(ref(db, "testObj"),{
                alpha:"dddd"
            })
            .then(()=>{
                console.log("Data updated successfully");
            })
            .catch((error)=>{
                console.log(error);
            });
        }

        //UpdateData();

        //const objref = ref(db,'testObj/alpha');
        //const child = child(objref,'users'),
        //set(objref,"boum3iza").then(()=>{console.log('success');})
        /*
        get(objref).then(( snapshot)=>{

        const old = snapshot.val();
        old.push('c');
        old.push('d');
        console.log('old',old);

        set(objref,old).then(()=>{console.log('updated');});
        //console.log('new',newVal);

        }).catch((error)=>{console.log(error)})
*/
        
//registerUserWithEmailAndPassword("test1234@gmail.com","12345678");
    


//const myPlaintextPassword = 's0/\/\P4$$w0rD';
//const someOtherPlaintextPassword = 'not_bacon';

/*
bcrypt.compare(someOtherPlaintextPassword, "$2b$10$/61KxLwfVdMB7uQILEdbweYJR1YdubTmGjGrcWoII6vHKJwb5fLBK", (err, result) => {
    // result == false
    console.log(result);
});
*/

async function test() {
    const hash = await hashPasswordWithBcrypt('momento');
    console.log(hash);
}

/*
hashPasswordWithBcrypt('salut').then((hash)=>{
    console.log(hash);
})
*/

registerUserWithEmailAndPassword('bob@test.com','bobpassword','bob');