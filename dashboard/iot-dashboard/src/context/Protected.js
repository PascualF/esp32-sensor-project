import React, { useEffect } from 'react'
import { UserAuth } from './AuthContext'
import { useNavigate } from "react-router"

function Protected({children}) {

    const {user} = UserAuth()
    const navigate = useNavigate()

    
    useEffect(() => {
        if(!user) {
        navigate("/signin")
    }
    }, [navigate, user])
    

  return (
    <div>{children}</div>
  )
}

export default Protected