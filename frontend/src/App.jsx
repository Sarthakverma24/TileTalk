import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/LogIn.jsx';
import SignIn from './components/SignIn.jsx';
import Dashboard from './components/dashboard.jsx';
import RetroChat from './components/RetroChat.jsx';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/LogIn" element={<Login />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/RetroChat" element={<RetroChat/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
