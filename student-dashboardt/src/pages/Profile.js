function Profile() {
  const name = localStorage.getItem("name");
  const email = localStorage.getItem("email");
  const phone = localStorage.getItem("phone");
  const role = localStorage.getItem("role");
  const subject = localStorage.getItem("subject");
  const image = localStorage.getItem("image");

  return (
    <div className="page-box">
      <h1>Profile</h1>

      <div className="profile-card">
        <img src={image} alt="profile" className="profile-img" />

        <h2>{name}</h2>
        <p>Email: {email}</p>
        <p>Phone: {phone}</p>
        <p>Role: {role}</p>
        <p>Subject: {subject}</p>
      </div>
    </div>
  );
}

export default Profile;