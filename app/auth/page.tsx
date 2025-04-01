"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/init/firebase";
import { useTheme } from "next-themes";
import { useUsernameCheck } from "@/hooks/useUsernameCheck";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { sendConversionEvent } from "@/lib/utils/meta-pixel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

// Type for the registration form data
interface FormData {
  name: string;
  email: string;
  username: string;
  password: string;
}

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showRegisterPassword, setShowRegisterPassword] =
    useState<boolean>(false);

  // Using useTheme to maintain consistency with the rest of the app
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { setTheme } = useTheme();

  const [username, setUsername] = useState("");
  const { isAvailable, isLoading: usernameIsLoading } =
    useUsernameCheck(username);

  useEffect(() => {
    if (isSuccess) {
      redirect("/finance");
    }
  }, [isSuccess]);

  // Define a properly typed handler for the debounced username check
  const handleUsernameChange = (value: string) => {
    setUsername(value);
  };

  // Use the typed handler with the debounced callback
  const debouncedSetUsername = useDebouncedCallback(handleUsernameChange, 300);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Clear any existing cached data before login
      localStorage.removeItem("cached_user_details");

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Wait for the ID token to ensure auth is fully set up
      const idToken = await userCredential.user.getIdToken();

      // Store the token in localStorage
      localStorage.setItem("auth_token", idToken);

      // Track login event
      await sendConversionEvent({
        event_name: "Login",
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
          em: [email],
          external_id: [userCredential.user.uid],
          client_ip_address: "", // This will be set server-side
          client_user_agent: navigator.userAgent,
        },
        event_source_url: window.location.href,
        action_source: "website",
      });

      // Wait a brief moment to ensure Firebase auth state is fully propagated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Login Successful", {
        description: "You have been logged in successfully.",
      });

      setIsSuccess(true);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login Failed", {
        description: "Invalid email or password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const registerData: FormData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    };

    try {
      // Clear any existing cached data
      localStorage.removeItem("cached_user_details");

      // First, create the user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerData.email,
        registerData.password
      );

      // Wait for the ID token to ensure auth is fully set up
      const idToken = await userCredential.user.getIdToken();

      // Store the token in localStorage
      localStorage.setItem("auth_token", idToken);

      // Track registration event
      await sendConversionEvent({
        event_name: "CompleteRegistration",
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
          em: [registerData.email],
          external_id: [userCredential.user.uid],
          client_ip_address: "", // This will be set server-side
          client_user_agent: navigator.userAgent,
        },
        custom_data: {
          username: registerData.username,
        },
        event_source_url: window.location.href,
        action_source: "website",
      });

      // Then, register the user in your backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SSO_URL}/api/profile/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(registerData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to register user in backend");
      }

      const data = await response.json();
      console.log("User registered:", data);

      // Wait a brief moment to ensure Firebase auth state is fully propagated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Registration Successful", {
        description: "Your account has been created successfully.",
      });

      setIsSuccess(true);
    } catch (error: unknown) {
      console.error("Registration error:", error);

      // Extract the error message
      let errorMessage = "An error occurred during registration.";

      if (error instanceof Error) {
        if ("code" in error) {
          switch ((error as { code: string }).code) {
            case "auth/email-already-in-use":
              errorMessage = "This email is already registered.";
              break;
            case "auth/invalid-email":
              errorMessage = "Invalid email address format.";
              break;
            case "auth/operation-not-allowed":
              errorMessage =
                "Email/password accounts are not enabled. Please contact support.";
              break;
            case "auth/weak-password":
              errorMessage = "Password should be at least 6 characters.";
              break;
            default:
              // If we have a message from the error, use it
              errorMessage = error.message || errorMessage;
          }
        } else {
          errorMessage = error.message || errorMessage;
        }
      }

      toast.error("Registration Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Clear any existing cached data
      localStorage.removeItem("cached_user_details");

      // Sign in with Google
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Store the token in localStorage
      localStorage.setItem("auth_token", idToken);

      // Track Google sign-in event
      await sendConversionEvent({
        event_name: "Login",
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
          em: result.user.email ? [result.user.email] : [],
          external_id: [result.user.uid],
          client_ip_address: "", // This will be set server-side
          client_user_agent: navigator.userAgent,
        },
        event_source_url: window.location.href,
        action_source: "website",
      });

      // Then, register the user in your backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SSO_URL}/api/profile/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            name: result.user.displayName,
            email: result.user.email,
            username: result.user.uid,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to register user in backend");
      }

      const data = await response.json();
      console.log("User registered:", data);

      // Wait a brief moment to ensure Firebase auth state is fully propagated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Login Successful", {
        description: "You have been logged in successfully.",
      });

      setIsSuccess(true);
    } catch (error: unknown) {
      console.error("Google sign-in error:", error);
      let errorMessage = "Failed to sign in with Google. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      toast.error("Google Sign-in Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex min-h-screen w-screen flex-col items-center justify-center py-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to KorinAI Desk
          </h1>
          <p className="text-sm text-muted-foreground">
            Your personal finance management app
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="#"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3 mt-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                  <div className="relative w-full mt-3">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full mt-3"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="mr-2"
                      viewBox="0 0 16 16"
                    >
                      <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z" />
                    </svg>
                    Google
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Signup Form */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Enter your details to create a new account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="johndoe123"
                      onChange={(e) => debouncedSetUsername(e.target.value)}
                      required
                    />
                    {username && (
                      <div className="text-xs">
                        {usernameIsLoading ? (
                          <span className="text-muted-foreground">
                            Checking availability...
                          </span>
                        ) : isAvailable ? (
                          <span className="text-green-500">
                            Username is available
                          </span>
                        ) : (
                          <span className="text-red-500">
                            Username is already taken
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() =>
                          setShowRegisterPassword(!showRegisterPassword)
                        }
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3 mt-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                  <div className="relative w-full mt-3">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full mt-3"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="mr-2"
                      viewBox="0 0 16 16"
                    >
                      <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z" />
                    </svg>
                    Google
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="px-8 text-center text-sm text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
