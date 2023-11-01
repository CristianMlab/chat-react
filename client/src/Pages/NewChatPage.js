import NewChatForm from "../Components/NewChatForm"
import Header from "../Components/Header"

const NewChatPage = () => {
    return (
      <>
        <Header></Header>
        <div class="login-wrapper-wrapper">
          <div class="login-wrapper">
            <h2 class="centered">Start a New Chat</h2>
            <br/>
            <NewChatForm></NewChatForm>
            <br/>
          </div>
        </div>
      </>
      )
}

export default NewChatPage