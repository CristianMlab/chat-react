import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NewChatForm = () => {
    const [usernames, setUsernames] = useState([])
    const [title, setTitle] = useState("")
    const [participant, setParticipant] = useState("")
    const [participantList, setParticipantList] = useState([])
    const [username, setUsername] = useState("")

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Fetch usernames from the backend when the component mounts
        fetchUsernames();
        getUser();
    }, []);

    const fetchUsernames = async () => {
        try {
          const response = await fetch('/api/gets/allusernames');
    
          if (!response.ok) {
            console.error('Failed to fetch usernames');
            navigate('/home');
          }

          const data = await response.json();
          setUsernames(data);
        } catch (error) {
            console.error('Failed to fetch usernames ', error);
            navigate('/home');
        }
      };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = '/api/posts/newchat';
        const data = {
            loggedUser: await getUser(),
            title,
            participantList
        }
        try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data)
            });
      
            if (response.ok) {
              // Request was successful
              console.log('Chat created successfully!');
              navigate('/home');
            } else {
              // Request failed
              console.error('Chat creation failed.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
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
          let usernameObj = await response.json();
          setUsername(usernameObj.username);
          return usernameObj;
        }
    }

    const addParticipant = async() => {
        const currentUser = await getUser();
        if(usernames.includes(participant) && !(participantList.includes(participant)) && participant !== currentUser.username){
            setParticipantList([...participantList, participant])
            setParticipant("")
        } else {
            console.log("wrong participant username")
        }
    }

    return (
        <form onSubmit = {handleSubmit}>
            <div className="inputDiv">
                    <label htmlFor="title">Chat Title </label> <br/>
                    <input name="title" value={title} onChange={({target}) => setTitle(target.value)}/>
            </div>
            <br/>
            <div className="inputDiv">
                    <label htmlFor="participant"> New Participant (username) </label> <br/>
                    <input name="participant" value={participant} onChange={({target}) => setParticipant(target.value)}/>
                    <span> </span>
                    <button type="button" onClick={addParticipant}>Add</button>
            </div>
            <div>
                <p>Participant List:</p>
                <ul>
                    <li><span class="username">{username}</span> (owner)</li>
                {participantList.map((item, index) => (
                    <li><span class="username">{item}</span></li>
                ))}
                </ul>
            </div>
            <br/>
            <button className="submitButton" disabled={title===''}>
                Create Chat
            </button>
        </form>
    )
}

export default NewChatForm;