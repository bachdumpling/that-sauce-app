import { signInWithGoogleAction, signInWithOTPAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-w-80 max-w-80 mx-auto">
        <h1 className="text-2xl font-medium">Sign up</h1>
        <p className="text-sm text-foreground">
          Already have an account?{" "}
          <Link className="text-primary font-medium underline" href="/sign-in">
            Sign in
          </Link>
        </p>

        <Tabs defaultValue="google" className="mt-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="otp">Email OTP</TabsTrigger>
          </TabsList>

          {/* Google sign up */}
          <TabsContent value="google">
            <div className="flex flex-col mt-4">
              <form action={signInWithGoogleAction}>
                <Button className="w-full" type="submit">
                  Sign up with Google
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-4">
                You will be redirected to Google to complete the sign-up process
              </p>
            </div>
          </TabsContent>

          {/* Email OTP sign up */}
          <TabsContent value="otp">
            <form className="flex flex-col mt-4">
              <div className="flex flex-col gap-2 [&>input]:mb-3">
                <Label htmlFor="email">Email</Label>
                <Input name="email" placeholder="you@example.com" required />
                <Button
                  type="submit"
                  className="w-full"
                  formAction={signInWithOTPAction}
                >
                  Send Magic Link
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We'll send you a login link to your email
                </p>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        <FormMessage message={searchParams} className="mt-4" />
      </div>
    </>
  );
}
