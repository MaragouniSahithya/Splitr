import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore";
import Layout from "./common/Layout";

const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? (
    <Layout>
      <Outlet />
    </Layout>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;
