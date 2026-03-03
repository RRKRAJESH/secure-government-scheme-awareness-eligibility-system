import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import UpdateProfile from "./pages/UpdateProfile";
import Dashboard from "./pages/Dashboard";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home" element={<Home />} />
      <Route path="/update-profile" element={<UpdateProfile />} />
      <Route path="/dashboard" element={<Dashboard />} />      
    </Routes>
  );
}

export default App;
