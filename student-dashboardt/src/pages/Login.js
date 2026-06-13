import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    subject: "",
    image: ""
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem("image", reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = () => {
    localStorage.setItem("name", form.name);
    localStorage.setItem("email", form.email);
    localStorage.setItem("phone", form.phone);
    localStorage.setItem("role", form.role);
    localStorage.setItem("subject", form.subject);

    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Sign Up</h1>

        <input name="name" placeholder="Name" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <input name="phone" placeholder="Phone" onChange={handleChange} />
        <input name="role" placeholder="Role (Doctor / Assistant)" onChange={handleChange} />
        <input name="subject" placeholder="Subject" onChange={handleChange} />

        <input type="file" name="image" onChange={handleChange} />

        <button onClick={handleSubmit}>Enter</button>
      </div>
    </div>
  );
}

export default Login;