import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import CarDetails from "./pages/CarDetails";
import BecomeOwner from "./pages/BecomeOwner";
import AddVehicle from "./pages/AddVehicle";
import HowItWorks from "./pages/HowItWorks";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import MyBookings from "./pages/MyBookings";
import MyVehicles from "./pages/MyVehicles";
import BookingDetails from "./pages/BookingDetails";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import Admin from "./pages/Admin";
import OwnerDashboard from "./pages/OwnerDashboard";
import Favorites from "./pages/Favorites";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import SelfieUpload from "./pages/SelfieUpload";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OwnerWithdrawals from "./pages/OwnerWithdrawals";
import AppDriverRentals from "./pages/AppDriverRentals";
import Classifieds from "./pages/Classifieds";
import CreateListing from "./pages/CreateListing";
import ClassifiedDetails from "./pages/ClassifiedDetails";
import MyListings from "./pages/MyListings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/cars/:id" element={<CarDetails />} />
            <Route path="/become-owner" element={<BecomeOwner />} />
            <Route path="/add-vehicle" element={<AddVehicle />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/booking/:id" element={<BookingDetails />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/my-vehicles" element={<MyVehicles />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/owner-withdrawals" element={<OwnerWithdrawals />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/selfie-upload/:sessionToken" element={<SelfieUpload />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/app-driver-rentals" element={<AppDriverRentals />} />
            <Route path="/classifieds" element={<Classifieds />} />
            <Route path="/classifieds/create" element={<CreateListing />} />
            <Route path="/classifieds/:id" element={<ClassifiedDetails />} />
            <Route path="/my-listings" element={<MyListings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
