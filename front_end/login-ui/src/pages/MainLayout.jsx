import "../styles/layout.css";
import watermarkImage from "../assets/TamilNadu_Seal_With_English_Caption.svg.png";

function MainLayout({ children }) {
  return (
    <div className="app-bg">
      <div className="watermark-container">
        <img src={watermarkImage} alt="" className="watermark-image" />
      </div>
      {children}
    </div>
  );
}

export default MainLayout;