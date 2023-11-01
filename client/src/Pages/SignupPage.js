import SignupForm from '../Components/SignupForm'

const SignupPage = (props) => {
    return (
      <div class="login-wrapper-wrapper">
        <div class="login-wrapper">
          <h2 class="centered">Sign Up</h2>
          <br/>
          <SignupForm setReg={props.setReg}></SignupForm>
          <br/>
          <div>Already have an account? <a href="/login">Login</a></div>
        </div>
      </div>
      )
}

export default SignupPage