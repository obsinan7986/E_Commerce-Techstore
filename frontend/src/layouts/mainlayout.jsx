import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/layout/Footer";

const MainLayout = () => {
  return (
    <>
      <Navbar />
      {/* No padding here — each page controls its own spacing */}
      <main style={{ minHeight: "80vh" }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;
