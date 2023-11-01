import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';


const Header = () => {
    const [username, setUsername] = useState("");

    const navigate = useNavigate();

    const newChat = () => {
        navigate('/home/newchat');
      }
  
    const logout = () => {
        sessionStorage.removeItem('token');
        navigate('/');
    }

    const home = () => {
        navigate('/home');
    }

    const getUser = async() => {
        const url = "/api/posts/user"
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({token: sessionStorage.getItem("token")})
        });
        if(!response.ok){
          navigate("/login");
        } else {
          let user = await response.json();
          setUsername(user.username);
          return user;
        }
    }

    useEffect(()=> {
        getUser();
    }, [])

    return (
        <div id="infooptions">
          <div id="options">
            <p>Logged in as {username}</p>
            <button class="flexbtn roundedbtn grey" onClick={home}>Home</button>
          </div>
          <div id="options">
            <button class="flexbtn roundedbtn green" onClick={newChat}>Start a New Chat</button>
            <button class="flexbtn roundedbtn red" onClick={logout}>Logout</button>
          </div>
        </div>
    )
}


export default Header;