import "../styles/home.css";

function Home() {
  return (
    <div className="home-bg">
      <div className="home-container">

        <h1>To explore more, update your profile</h1>
        <h1></h1>

        <div className="home-buttons">
          <button className="primary-btn">
            Update Profile
          </button>

          <button className="secondary-btn">
            Skip Now
          </button>
        </div>

      </div>
    </div>
  );
}

export default Home;
