import React, { useEffect } from 'react'
import {useNavigate} from "react-router"
import GoogleButton from "react-google-button"
import { UserAuth } from '../context/AuthContext'


export default function SignIn() {

    const {user, googleSignIn} = UserAuth()
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        try{
            await googleSignIn();
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        if(user != null) {
            navigate("/")
        }
    }, [navigate, user])

    return (
    <div className='flex flex-col overflow-hidden min-h-screen w-full justify-center items-center p-4 lg:p-6 bg-blue-800'>
        <GoogleButton 
            onClick={handleGoogleLogin}
        />
    </div>
    )
}
