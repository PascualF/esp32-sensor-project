import { useContext, createContext, useEffect, useState } from "react";
import { 
    GoogleAuthProvider, 
    signInWithPopup, /* 
    signInWithRedirect, */
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { auth } from "../firebase/firebase";

const AuthContext = createContext()

export const AuthContextProvider = ({children}) => {
    const [user, setUser] = useState({})

    const googleSignIn = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
          .then((result) => {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken
            const user = result.user
            localStorage.setItem("tokenEsp32Sensors", token)
            localStorage.setItem("userEsp32Sensors", user)
          }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.customData.email;
            const credential = GoogleAuthProvider.credentialFromError(error)
            console.log(`Code error: ${errorCode}`)
            console.log(`Message error: ${errorMessage}`)
            console.log(`Email error: ${email}`)
            console.log(`Credential error: ${credential}`)
          })
    }

    const googleSignOut = () => {
        signOut(auth).then(() => {
            console.log('Sign-out successful')
        }).catch((error) => {
            console.error(error)
        })
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
            console.log(currentUser)
        });
        return () => {
            unsubscribe();
        }
    },[])

    return (
        <AuthContext.Provider value={{googleSignIn, user, googleSignOut}}>
            {children}
        </AuthContext.Provider>
    )
}

export const UserAuth = () => {
    return useContext(AuthContext)
}