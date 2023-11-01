import { useEffect, useState, useRef } from 'react';
import io from "socket.io-client";
import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header'
import "../css/MainPage.css"

const socket = io.connect("http://localhost:5000"); 

const MainPage = (props) => {

    const navigate = useNavigate();

    const [associatedChats, setAssociatedChats] = useState([]);
    const [idUsernameMap, setIdUsernameMap] = useState(new Map());
    //NOTE: selectedChat is just an index for an element of associatedChats (in string form)
    const [selectedChat, setSelectedChat] = useState("");
    const [message, setMessage] = useState("");
    const [username, setUsername] = useState("");


    const sendMessageInput = useRef(null);

    const addMessage = (message, self=false) => {
      console.log("adding ", message);
      if(self){
        message.idUser = -1;
      }
      setAssociatedChats((prevState) => {
        return prevState.map((chat, i)=> {
          if(chat.idConversation === message.idConversation){
            //solutie (cretina) pentru ca se apeleaza callbackul de 2 ori la fiecare mesaj (strictmode?)
            //if there are no messages in the chat or if the message isn't identical to the last message
            //if(chat.messages.length === 0 || (!(chat.messages[chat.messages.length - 1].content === message.content && chat.messages[chat.messages.length - 1].timeSent === message.timeSent))){
            chat.messages = [...chat.messages, message]
            //}
            if(parseInt(selectedChat) !== i){
              chat.unread = true;
            }
          }
          return chat;
        })
      })
    }

    const handleEnter = (event) => {
      if(event.keyCode ===13) {
        console.log("enter pressed");
      }
      if(event.keyCode === 13 && document.activeElement === sendMessageInput.current){
        sendMessage();
      }
    }

    useEffect(() => {
      // Fetch usernames from the backend when the component mounts
      //setSocket(io.connect("http://localhost:5000"));
      console.log("FETCHING STUFF");
      fetchIdUsernameMap();
      fetchAssociatedChats();
    }, []);

    useEffect(() => {
      document.addEventListener('keydown', handleEnter);
      return () => {
        document.removeEventListener('keydown', handleEnter);
      }
    }, [message, associatedChats]);

    useEffect(() => {
      console.log("socket change?");
      socket.on("receiveMessage", (data) => {
        console.log("receiving ", data);
        addMessage(data);
      });
      return () => {
        socket.off("receiveMessage");
        console.log("leave")
      }
    }, [socket]);

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

    const fetchAssociatedChats = async() => {
      try {
        const id = (await getUser()).idUser;
        const url = `/api/gets/associatedchats/${id}`
        const response = await fetch(url);
  
        if (!response.ok) {
          console.error('Failed to fetch chats');
        }

        const data = await response.json();
        console.log(data)
        setAssociatedChats(data);
        data.forEach((chat) => {socket.emit("joinRoom", chat.idConversation)});
      } catch (error) {
          console.error('Failed to fetch chats ', error);
      }
    };

    const fetchIdUsernameMap = async () => {
      try {
        const url = `/api/gets/idusername`
        const response = await fetch(url);
  
        if (!response.ok) {
          console.error('Failed to fetch idUsernameMap');
        }

        const data = await response.json();
        setIdUsernameMap(new Map(Object.entries(data)));
      } catch (error) {
          console.error('Failed to fetch idUsernameMap ', error);
      }
    }

    const sendMessage = async () => {
      const urlMessage = '/api/posts/message';
      const urlTime = '/api/servertime';
      try {
        
        const timeSent = await (await fetch(urlTime)).json();
        const messageObj = {
          idConversation: associatedChats[parseInt(selectedChat)].idConversation, 
          token: sessionStorage.getItem('token'), 
          content: message,
          timeSent
        }
        addMessage(messageObj, true);
        setMessage("");
        const response = await fetch(urlMessage, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageObj)
          
        });
      
        if (response.ok) {
          console.log("attempting to send message ", messageObj);
          await socket.emit("sendMessage", messageObj);
        } else {
          // Request failed
          console.error('sendMessage Failed');
        }

      } catch(error){
        console.error(error);
      }
    }


    const messagesToJSX = (messages) => {
      let elements = [];
      let lastDate = null;
      messages.forEach((message, i) => {
        let messageDate = new Date(message.timeSent);
        if(lastDate === null || (lastDate.getMonth() !== messageDate.getMonth() || lastDate.getDay() !== messageDate.getDay())){
          elements = [...elements, <p class="datechange">{messageDate.toLocaleString('default', {day:'numeric', month:'long'})}</p>]
          lastDate = messageDate;
        }
        const messageElem = (
          <div class="message" key={i}>
            <span class="messagetime">[{messageDate.toLocaleTimeString('default', {hour: 'numeric', minute: 'numeric', hour12: true})}] </span> 
            <span class="messageuser">{message.idUser !== -1 ? idUsernameMap.get(message.idUser.toString()) : username} </span> 
            <span class="messagecontent">{message.content}</span>
          </div>
        )
        elements = [...elements, messageElem]
      })

      return elements;
    }

    const chatSettings = () => {
      navigate('/home/chatsettings', {
        state:associatedChats[selectedChat]
      })
    }

    return (
      <div id="wrapper">

        <Header></Header>

        <div id="mainwrapper">
          <div id="chat-select">
            <p>Chat Channels</p>
            <ul id="chat-options">
            {associatedChats.map((item, key) => (
                  <li key={key} class={`chat-option-tile ${parseInt(selectedChat) === key ? "focused" : "not-focused"} ${item.unread ? "unread" : ""}`} onClick={()=> {setSelectedChat(key); associatedChats[key].unread = false}}># {item.title}</li>
                ))}
            </ul>
          </div>
          
          <div id="chat" style={{ display: selectedChat === "" ? "none" : "block"}}>
            <div id="chat-title">
              <p>{selectedChat !== "" ? associatedChats[parseInt(selectedChat)].title : <></>}</p>
              <button class="roundedbtn grey" onClick={chatSettings}>Chat Details</button>
            </div>
            <div id="chat-body-wrapper">
              <div id="chat-body">
              {selectedChat !== "" ? messagesToJSX(associatedChats[parseInt(selectedChat)].messages) : <></>}
              </div>
            </div>
            <div id="chat-send-message">
              <input name="message" value={message} placeholder={`Send Message in ${selectedChat !== "" ? associatedChats[parseInt(selectedChat)].title : ""}`} onChange={({target}) => setMessage(target.value)} ref={sendMessageInput}/>
            </div>
          </div>
        </div>
      </div>
      )
}

export default MainPage