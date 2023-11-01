import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginForm from '../Components/LoginForm'
import "../css/LoginPage.css"

const LoginPage = (props) => {

  const navigate = useNavigate();

  useEffect(() => {
    console.log(sessionStorage.getItem("token"));
    isUserLoggedIn();
  }, [])

  const isUserLoggedIn = async() => {
    if(sessionStorage.getItem("token") === null){
      props.setLoggedIn(false);
      return;
    }
    const url = "/api/posts/user"
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({token: sessionStorage.getItem("token")})
    });
    if(!response.ok){
      props.setLoggedIn(false);
    } else {
      props.setLoggedIn(true);
      navigate("/home");
    }
  }
  
  return (
    <div class="login-wrapper-wrapper">
      <div class="login-wrapper">
        <h2 class="centered">Login</h2>
        <LoginForm></LoginForm>
        <br/>
        <div>Don't have an account? <a href="/signup">Sign up</a></div>
      </div>
    </div>
    )
}

export default LoginPage