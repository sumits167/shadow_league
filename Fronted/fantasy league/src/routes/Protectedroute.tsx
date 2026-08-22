import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Loading from "@/components/Loading";
import { useMe } from "@/features/auth/hooks/useAuth";

export default function Protectedroute() {
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useMe();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, isError, user, navigate]);

  if (isLoading) {
    return <Loading />;
  }

  if (isError || !user) {
    return null;
  }

  return <Outlet />;
}