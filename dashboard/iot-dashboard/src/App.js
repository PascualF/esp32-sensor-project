import Dashboard from './components/Dashboard';
import SignIn from './components/SignIn';
import Navbar from './components/Navbar';
import {Routes, Route} from "react-router"

import './App.css';
import { AuthContextProvider } from './context/AuthContext';
import Protected from './context/Protected';

function App() {
  return (
    <div>
      <AuthContextProvider>
        <Navbar/>
        <Routes>
          <Route path='/' element={<Protected><Dashboard /></Protected>}/>
          <Route path='/signin' element={<SignIn />}/>
        </Routes>
      </AuthContextProvider>
    </div>
  );
}

export default App;
