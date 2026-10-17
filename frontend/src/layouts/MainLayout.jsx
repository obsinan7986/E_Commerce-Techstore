import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/layout/Footer";

const MainLayout = () => {
  return (
    <>
      <Navbar />
      {/* No padding here — each page controls its own spacing */}
      <main style={{ minHeight: "80vh", width: "100%", maxWidth: "100%", overflowX: "hidden", margin: 0, padding: 0 }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;
