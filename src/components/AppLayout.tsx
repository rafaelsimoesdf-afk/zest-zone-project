import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomTabBar from "@/components/BottomTabBar";
import Footer from "@/components/Footer";

const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-[72px]">
        <Outlet />
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <div className="h-14 md:hidden" />
      <BottomTabBar />
    </div>
  );
};

export default AppLayout;
