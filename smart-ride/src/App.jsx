import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleMapsProvider } from "./context/GoogleMapsContext";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import DriverLogin from './pages/DriverLogin';
import DriverSignup from './pages/DriverSignup';
import BookRide from "./pages/BookRide";
import RideSummary from "./pages/RideSummary";
import RideSuccess from "./pages/RideSuccess";
import RideTracking from "./pages/RideTracking";
import Dashboard from "./pages/Dashboard";
import RideSimulation from "./pages/RideSimulation";
import MapTest from "./pages/MapTest";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <GoogleMapsProvider>
      <Router>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/driver-login" element={<DriverLogin />} />
        <Route path="/driver-signup" element={<DriverSignup />} />
        <Route path="/book" element={<BookRide />} />
        <Route path="/ride-summary" element={<RideSummary />} />
        <Route path="/success" element={<RideSuccess />} />
        <Route path="/ride-tracking" element={<RideTracking />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/simulation" element={<RideSimulation />} />
        <Route path="/api-test" element={<MapTest />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </GoogleMapsProvider>
  );
}

export default App;