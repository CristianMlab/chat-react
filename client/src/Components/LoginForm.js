import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginForm = (props) => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = '/api/posts/login';
        const userData = {
            email,
            password
        };
        console.log(userData);
        try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(userData)
            });     
            if (response.ok) {
              // Request was successful
              console.log('User logged in successfully!');
              let tokenObj = await response.json();
              //props.setLoggedUser(userData);
              sessionStorage.setItem("token", tokenObj.token);
              navigate('/home');
            } else {
              // Request failed
              console.error('Login Failed.');
            }
        } catch (error) {
          console.error('Error:', error);
        }
    }

    return (
        <form onSubmit = {handleSubmit}>
            <div className="inputDiv">
                    <label htmlFor="email">Email </label> <br/>
                    <input name="email" value={email} onChange={({target}) => setEmail(target.value)}/>
            </div>
            <br/>
            <div className="inputDiv">
                    <label htmlFor="password">Password </label> <br/>
                    <input name="password" value={password} onChange={({target}) => setPassword(target.value)}/>
            </div>
            <br/>
            <button className="submitButton" disabled={email==='' || password===''}>
                Login
            </button>
        </form>
    )
}

export default LoginForm;