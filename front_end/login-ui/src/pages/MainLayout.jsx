import "../styles/layout.css";

function MainLayout({ children }) {
  return (
    <div className="app-bg">
      {children}
    </div>
  );
}

export default MainLayout;