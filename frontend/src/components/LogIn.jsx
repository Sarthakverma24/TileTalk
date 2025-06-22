import image from './assets/image.png';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [LoginData, setLoginData] = useState({
    username: '',
    password : ''
  });
  const [user, setUser] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Sending login data:", LoginData);
    fetch("http://localhost:8080/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(LoginData),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Login failed");
        }
        return res.json();
      })
      .then((loggedUser) => {
        console.log("Login successful", loggedUser);
        setUser(loggedUser);
        // ✅ Store username for WebSocket
        const username = loggedUser.username || LoginData.username;
        localStorage.setItem("username", username);
        console.log("Stored in localStorage:", username);
        setLoginData({ username: '', password: '' });
        navigate("/dashboard");
      })
      .catch((err) => {
        console.error("Login failed:", err.message);
        alert("Login failed: " + err.message);
      });
  };

  return (
    <>
      <section className="h-screen overflow-hidden">
        <div className="h-full ">
          <div className="flex h-full flex-wrap items-center justify-center lg:justify-between">
            <div className="bg-orange-900 items-center size-200 shrink-1 mb-12 grow-0 basis-auto md:mb-0 md:w-9/12 md:shrink-0 lg:w-6/12 xl:w-6/12 flex justify-center">
              <img src={image} className="w-1/2" />
            </div>

            <div className="mb-12 md:mb-0 md:w-8/12 lg:w-5/12 xl:w-5/12">
              <form onSubmit={handleSubmit}>
                <div className="mb-1 text-center">
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-black">Log In</h1>
                  <div className="mt-2 h-1 w-12 bg-blue-600 mx-auto rounded"></div>
                </div>

                <div className="relative z-0 w-full mb-6 group">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={LoginData.username}
                    onChange={(e) => setLoginData({ ...LoginData, username: e.target.value })}
                    className="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent py-2.5 px-0 text-sm text-black focus:border-blue-600 focus:outline-none focus:ring-0"
                    placeholder=" "
                    required
                  />
                  <label htmlFor="username" className="absolute top-3 left-0 z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600">
                    Username
                  </label>
                </div>

                <div className="relative z-0 w-full mb-6 group">
                  <input
                    type="password"
                    name="password"
                    id="password" 
                    value={LoginData.password}
                    onChange={(e) => setLoginData({ ...LoginData, password: e.target.value })}
                    className="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent py-2.5 px-0 text-sm text-black focus:border-blue-600 focus:outline-none focus:ring-0"
                    placeholder=" "
                    required
                  />
                  <label htmlFor="password" className="absolute top-3 left-0 z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600">
                    Password
                  </label>
                </div>

                <div className="mb-6 flex items-center justify-between">
                  <a href="#!">Forgot password?</a>
                </div>

                <div className="text-center lg:text-left items-center">
                  <button
                    type="submit" 
                    className="inline-block w-1/2 rounded bg-black px-7 pb-2 pt-3 text-sm font-medium uppercase leading-normal text-white transition duration-150 ease-in-out hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    Login
                  </button>

                  <p className="mb-0 mt-2 pt-1 text-sm font-semibold">
                    Don't have an account?
                    <br/><br/>
                    <Link
                      to="/signin"
                      className="text-red-500 transition duration-150 ease-in-out hover:text-red-600 focus:text-red-600 active:text-red-700"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Login;
    