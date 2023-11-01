import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../Components/Header';
import "../css/ChatSettings.css";

const ChatSettings = () => {
    const [memberList, setMemberList] = useState([]);
    const [personalInfo, setPersonalInfo] = useState({});
    const [newMember, setNewMember] = useState("");

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        fetchChatMemberDetails();
    }, [])

    const fetchChatMemberDetails = async() => {
        const url = '/api/posts/chatmembers';
        try {
            const tokenChannel = {
                token: sessionStorage.getItem('token'),
                channel: location.state.idConversation
            }
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(tokenChannel)
            });     
            if (response.ok) {
              // Request was successful
              const result = await response.json();
              console.log(result)
              setMemberList(result.memberList);
              setPersonalInfo(result.personal);
            } else {
              // Request failed
              console.error('Fetch Failed.');
              navigate('/');
            }
        } catch (error) {
          console.error('Error:', error);
          navigate('/');
        }
    }

    const toggleAdmin = async(e, i) => {
        if(i < 0 || i >= memberList.length){
            return;
        }
        const url = '/api/posts/toggleadmin';
        try{
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idUser: memberList[i].idUser,
                    idConversation: location.state.idConversation,
                    token: sessionStorage.getItem('token')
                })
            });
            if (response.ok) {
                // Request was successful
                setMemberList((prev) => {
                    prev[i].admin = Number(!prev[i].admin);
                    return [... prev];
                })
              } else {
                // Request failed
                console.error('toggle admin failed.');
                navigate('/');
              }
        } catch(e){
            console.error('Error:', e);
            navigate('/');
        }
    }

    const kick = async(e, i) => {
        if(i < 0 || i >= memberList.length){
            return;
        }
        const url = '/api/posts/kick';
        try{
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idUser: memberList[i].idUser,
                    idConversation: location.state.idConversation,
                    token: sessionStorage.getItem('token')
                })
            });
            if (response.ok) {
                // Request was successful
                setMemberList((prev) => {
                    return prev.filter((el, ipr) => {
                        return ipr !== i;
                    });
                })
              } else {
                // Request failed
                console.error('toggle admin failed.');
                navigate('/');
              }
        } catch(e){
            console.error('Error:', e);
            navigate('/');
        }
    }

    const addMember = async() => {
        const url = '/api/posts/addmember';
        let duplicate = false
        memberList.forEach((member) => {
            if(member.username === newMember){
                duplicate = true;
            }
        })
        if(duplicate) return;
        try{
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: newMember,
                    idConversation: location.state.idConversation,
                    token: sessionStorage.getItem('token')
                })
            })
            if(response.ok){
                // Request was successful
                const idUser = await response.json();
                const newMem = {
                    idUser,
                    admin: 0,
                    username: newMember
                }
                setMemberList((prev) => {
                    return [...prev, newMem];
                })
                setNewMember("");
            } else {
                // Request failed
                console.error('add member failed.');
                navigate('/');
            }
        } catch(e){
            console.error('Error:', e);
            navigate('/');
        }
    }

    return (
        <>
            <Header></Header>
            <div class="login-wrapper-wrapper">
                <div class="login-wrapper">
                    <h2 class="centered">{location.state.title}</h2>
                    <p>Chat member count: {memberList.length}</p>
                    <p>Chat member list: </p>
                    <ul class="memberlist">
                        {memberList.map((member, i) => {
                            return (
                                <li key={i}>
                                    <span>{member.username} </span> 
                                    <span> {member.admin === 1 ? "(admin) " : ""}</span> 
                                    <span>{member.idUser === location.state.idCreator ? "(owner) " : ""}</span>
                                    {personalInfo.idUser === location.state.idCreator && personalInfo.idUser !== member.idUser ? <button onClick={e => toggleAdmin(e, i)}>{member.admin === 1 ? "Revoke admin" : "Grant admin"}</button> : ""}
                                    {personalInfo.admin === 1 && member.admin === 0 ? <button onClick={e => kick(e,i)}>Kick</button>: ""}
                                </li>
                            )
                        })}
                    </ul>
                    {personalInfo.admin === 1 ? 
                        <div>
                            <p>Add a new member to the chat (by username)</p>
                            <input value={newMember} onChange={({target}) => setNewMember(target.value)}></input>
                            <button onClick={addMember}>Add</button>
                        </div>
                        : 
                        <p>You do not have admin rights in this channel.</p>    
                    }
                </div>
            </div>
        </>
    )
}

export default ChatSettings;