import { useState, useEffect } from 'react';
import image from './assets/image.png';
import { useNavigate } from 'react-router-dom';


function SignIn() {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    phone_no: '',
    gmail: '',
    age: '',
    password :''
  });
  const navigate = useNavigate();
  const [user, setUser] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/signin")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUser(data);
        } else {
          setUser([]);
        }
      })
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch("http://localhost:8080/api/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        age: parseInt(formData.age) || 0,

      })

    })
      .then(res => res.json()
    
    )
      .then(newUser => {
        setUser([...user, newUser]);
        setFormData({
          username: '',
          name: '',
          phone_no: '',
          gmail: '',
          age: '',
          password:''
        });
        navigate("/login");
      })
      .catch(err => console.error("Post error:", err));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 lg:w-7/12 bg-orange-900 items-center justify-center p-4">
        <img
          src={image}
          className="w-full max-w-lg object-contain"
          alt="Sign In Visual"
        />
      </div>

      <div className="w-full md:w-1/2 lg:w-5/12 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-gray-800">Sign In</h1>
              <div className="mt-2 h-1 w-12 bg-blue-600 mx-auto rounded" />
            </div>

            {/* Username */}
            <div className="relative z-0 w-full mb-6 group">
              <input
                type="text"
                name="username"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent py-2.5 px-0 text-sm text-black focus:border-blue-600 focus:outline-none focus:ring-0"
                placeholder=" "
                required
              />
              <label htmlFor="username" className="absolute top-3 left-0 z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600">
                Username
              </label>
            </div>

            {/* Name */}
            <div className="relative z-0 w-full mb-6 group">
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent py-2.5 px-0 text-sm text-black focus:border-blue-600 focus:outline-none focus:ring-0"
                placeholder=" "
                required
              />
              <label htmlFor="name" className="absolute top-3 left-0 z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600">
                Name
              </label>
            </div>

            {/* Phone Number */}
            <div className="relative z-0 w-full mb-6 group">
              <input
                type="text"
                name="phone_no"
                id="phone_no"
                value={formData.phone_no}
                onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                className="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent py-2.5 px-0 text-sm text-black focus:border-blue-600 focus:outline-none focus:ring-0"
                placeholder=" "
                required
              />
              <label htmlFor="phone_no" className="absolute top-3 left-0 z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600">
                Phone Number
              </label>
            </div>

            {/* Gmail (as string) */}
            <div className="relative z-0 w-full mb-6 group">
              <input
                type="email"
                name="gmail"
                id="gmail"
                value={formData.gmail}
                onChange={(e) => setFormData({ ...formData, gmail: e.target.value })}
                className="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent py-2.5 px-0 text-sm text-black focus:border-blue-600 focus:outline-none focus:ring-0"
                placeholder=" "
                required
              />
              <label htmlFor="gmail" className="absolute top-3 left-0 z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600">
                Gmail ID
              </label>
            </div>

            {/* Age */}
            <div className="relative z-0 w-full mb-6 group">
              <input
                type="number"
                name="age"
                id="age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent py-2.5 px-0 text-sm text-black focus:border-blue-600 focus:outline-none focus:ring-0"
                placeholder=" "
                required
              />
              <label htmlFor="age" className="absolute top-3 left-0 z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600">
                Age
              </label>
            </div>
            {/* Password */}
            <div className="relative z-0 w-full mb-6 group">
              <input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="peer block w-full appearance-none border-0 border-b-2 border-gray-300 bg-transparent py-2.5 px-0 text-sm text-black focus:border-blue-600 focus:outline-none focus:ring-0"
                placeholder=" "
                required
              />
              <label htmlFor="password" className="absolute top-3 left-0 z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600">
                Password
              </label>
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="w-full rounded bg-black px-7 py-3 text-sm font-medium uppercase text-white transition duration-150 ease-in-out hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
