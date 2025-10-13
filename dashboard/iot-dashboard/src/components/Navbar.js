import {Link} from "react-router"
import { UserAuth } from '../context/AuthContext'

export default function Navbar() {
    const {user, googleSignOut} = UserAuth();

    const handleSignOut = async () => {
        try{
            await googleSignOut();
        } catch(error) {
            console.error(error)
        }   
    }

    return (
        <div className='flex bg-blue-800 justify-between w-full'>
            <h1 className="text-xl md:text-2xl pl-8 pt-4 font-bold pl-3 mb-6 text-center md:text-left">
                IoT Maintenance Dashboard
            </h1>
            {user?.displayName ? 
                <div className="flex flex-col items-end justify-center pr-8">
                    <p className="font-bold">{`Hi, ${user?.displayName}`}</p>
                    <button
                        className="border rounded-md px-2 bg-gray-400"
                        onClick={handleSignOut}
                    >
                        Log Out
                    </button>
                </div>
            : 
                <Link to={{pathname:"/signin"}}/>
            }
        </div>
    )
}