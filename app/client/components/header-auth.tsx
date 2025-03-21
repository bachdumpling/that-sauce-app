import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get creator profile if it exists
  let creatorUsername = null;
  if (user) {
    const { data: creator } = await supabase
      .from("creators")
      .select("username")
      .eq("profile_id", user.id)
      .single();
    
    if (creator) {
      creatorUsername = creator.username;
    }
  }

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}!
      <form action={signOutAction}>
        <Button type="submit" variant={"outline"}>
          Sign out
        </Button>
      </form>
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/settings">Settings</Link>
      </Button>
      {creatorUsername && (
        <Button asChild size="sm" variant={"outline"}>
          <Link href={`/creator/${creatorUsername}`}>My Portfolio</Link>
        </Button>
      )}
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/search">Search</Link>
      </Button>
      {user.email?.includes("ohos.nyc") && (
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/admin">Admin</Link>
        </Button>
      )}
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">Sign up</Link>
      </Button>
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/search">Search</Link>
      </Button>
    </div>
  );
}
