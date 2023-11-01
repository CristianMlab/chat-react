import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignupPage from './Pages/SignupPage'
import LoginPage from './Pages/LoginPage'
import RegisterSuccess from './Pages/RegisterSuccess'
import MainPage from './Pages/MainPage'
import NewChatPage from './Pages/NewChatPage'
import ChatSettings from './Pages/ChatSettings'

function App() {

  //de adaugat autentificare cu token JWT
  const [ registerCheck, setRegisterCheck ] = useState(false);
  const [ loggedIn, setLoggedIn ] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/'>
          <Route index element={<LoginPage setLoggedIn = {setLoggedIn}/>} />
          <Route path='/login' element={<LoginPage setLoggedIn = {setLoggedIn}/>} />
          <Route path='/signup' element={<SignupPage setReg={setRegisterCheck}/>}/>
          <Route path='/signup/success' element={registerCheck ? <RegisterSuccess/> : <Navigate to='/' replace/>}/> 
          <Route path='/home' element={loggedIn ? <MainPage /> : <Navigate to='/' replace/>} />
          <Route path='/home/newchat' element={loggedIn ? <NewChatPage /> : <Navigate to='/' replace/>} />
          <Route path='/home/chatsettings' element={loggedIn ? <ChatSettings /> : <Navigate to='/' replace/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App