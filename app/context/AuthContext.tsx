"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

import {
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "../lib/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "user" | "admin";

  bio?: string;
  skills?: string[];
  education?: any[];
  experiences?: any[];
  experience?: any[];

  portfolioLinks?: string[];
  github?: string;
  linkedin?: string;
  instagram?: string;

  phone?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;

  country?: string;
  state?: string;
  city?: string;

  primaryRole?: string;
  secondaryRole?: string;
  experienceLevel?: string;
  openToWork?: boolean;

  declarationAccepted?: boolean;
  signature?: string;

  behanceUrl?: string;
  artstationUrl?: string;
  youtubeUrl?: string;
  otherUrl?: string;

  projects?: any[];
  certifications?: any[];
  publications?: any[];

  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<FirebaseUser | null>(null);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let unsubscribeProfile:
      | (() => void)
      | undefined;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);

          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = undefined;
          }

          if (!firebaseUser) {
            setProfile(null);
            return;
          }

          const userRef = doc(
            db,
            "users",
            firebaseUser.uid
          );

          unsubscribeProfile =
            onSnapshot(
              userRef,
              async (snapshot) => {
                if (snapshot.exists()) {
                  const existingProfile =
                    snapshot.data() as UserProfile;

                  if (
                    (!existingProfile.photoURL ||
                      existingProfile.photoURL ===
                        "") &&
                    firebaseUser.photoURL
                  ) {
                    const updatedProfile: UserProfile =
                      {
                        ...existingProfile,
                        photoURL:
                          firebaseUser.photoURL,
                        displayName:
                          existingProfile.displayName ||
                          firebaseUser.displayName ||
                          "",
                        email:
                          existingProfile.email ||
                          firebaseUser.email ||
                          "",
                        updatedAt:
                          new Date().toISOString(),
                      };

                    setProfile(
                      updatedProfile
                    );

                    await setDoc(
                      userRef,
                      updatedProfile,
                      {
                        merge: true,
                      }
                    );
                  } else {
                    setProfile(
                      existingProfile
                    );
                  }

                  return;
                }

                const isAdmin =
                  firebaseUser.email ===
                  "admin.cfound@gmail.com";

                const newProfile: UserProfile =
                  {
                    uid: firebaseUser.uid,
                    email:
                      firebaseUser.email ||
                      "",
                    displayName:
                      firebaseUser.displayName ||
                      "",
                    photoURL:
                      firebaseUser.photoURL ||
                      "",
                    role: isAdmin
                      ? "admin"
                      : "user",
                    createdAt:
                      new Date().toISOString(),
                  };

                setProfile(newProfile);

                await setDoc(
                  userRef,
                  newProfile,
                  {
                    merge: true,
                  }
                );
              }
            );
        }
      );

    return () => {
      unsubscribeAuth();

      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin:
          profile?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/* -------------------------------------------------------------------------- */
/*                               ERROR HANDLER                                */
/* -------------------------------------------------------------------------- */

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;

  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;

    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errorInfo: FirestoreErrorInfo = {
    error:
      error instanceof Error
        ? error.message
        : String(error),

    operationType,

    path,

    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified:
        auth.currentUser?.emailVerified,
      isAnonymous:
        auth.currentUser?.isAnonymous,
      tenantId:
        auth.currentUser?.tenantId,

      providerInfo:
        auth.currentUser?.providerData?.map(
          (provider) => ({
            providerId:
              provider.providerId,
            email: provider.email,
          })
        ) || [],
    },
  };

  console.error(
    "Firestore Error:",
    errorInfo
  );

  throw new Error(
    JSON.stringify(errorInfo)
  );
}