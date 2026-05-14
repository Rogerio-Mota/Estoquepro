import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AppProviders from "@/app/AppProviders";
import AppRoutes from "@/app/AppRoutes";

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          newestOnTop
          pauseOnFocusLoss={false}
        />
      </BrowserRouter>
    </AppProviders>
  );
}
