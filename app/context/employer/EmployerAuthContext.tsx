"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "../AuthContext";
import {
  EmployerCompany,
  ensureEmployerProfile,
  getEmployerProfile,
} from "../../lib/employer/employers";

interface EmployerAuthContextType {
  company: EmployerCompany | null;
  companyLoading: boolean;
  isEmployer: boolean;
  refreshCompany: () => Promise<void>;
}

const EmployerAuthContext = createContext<EmployerAuthContextType>({
  company: null,
  companyLoading: true,
  isEmployer: false,
  refreshCompany: async () => {},
});

export function EmployerAuthProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [company, setCompany] = useState<EmployerCompany | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setCompany(null);
      setCompanyLoading(false);
      return;
    }
    setCompanyLoading(true);
    try {
      const existing = await getEmployerProfile(user.uid);
      setCompany(existing);
    } catch (err) {
      console.error("Failed to load employer profile:", err);
      setCompany(null);
    } finally {
      setCompanyLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  return (
    <EmployerAuthContext.Provider
      value={{
        company,
        companyLoading,
        isEmployer: !!company,
        refreshCompany: load,
      }}
    >
      {children}
    </EmployerAuthContext.Provider>
  );
}

export function useEmployerAuth() {
  return useContext(EmployerAuthContext);
}

// Called right after an employer signs in / registers to make sure a
// company profile document exists in the `employers` collection.
export async function bootstrapEmployerProfile(
  uid: string,
  email: string,
  displayName?: string
) {
  return ensureEmployerProfile(uid, email, displayName);
}
