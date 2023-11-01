import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignupForm = (props) => {
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = '/api/posts/registeruser';
        const userData = {
            username,
            email,
            password
        };
        console.log(userData);

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
          });
    
          if (response.ok) {
            // Request was successful
            console.log('User registered successfully!');
            props.setReg(true);
            navigate('/signup/success');
          } else {
            // Request failed
            console.error('Registration failed.');
          }
        } catch (error) {
          console.error('Error:', error);
        }
    }

    return (
        <form onSubmit = {handleSubmit}>
            <div className="inputDiv">
                    <label htmlFor="email">Email </label>
                    <input name="email" value={email} onChange={({target}) => setEmail(target.value)}/>
            </div>
            <br/>
            <div className="inputDiv">
                    <label htmlFor="username">Username </label>
                    <input name="username" value={username} onChange={({target}) => setUsername(target.value)}/>
            </div>
            <br/>
            <div className="inputDiv">
                    <label htmlFor="password">Password </label>
                    <input name="password" value={password} onChange={({target}) => setPassword(target.value)}/>
            </div>
            <br/>
            <button className="submitButton" disabled={email==='' || username==='' || password===''}>
                Create Account
            </button>
        </form>
    )
}

export default SignupForm;