import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDownIcon } from "lucide-react";
import { ThemeSwitcher } from "./theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default async function Nav() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get creator profile if it exists
  let creatorUsername = null;
  let profile = null;
  if (user) {
    const { data: creator } = await supabase
      .from("creators")
      .select("username")
      .eq("profile_id", user.id)
      .single();

    if (creator) {
      creatorUsername = creator.username;
    }

    // Get user profile information
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userProfile) {
      profile = userProfile;
    } else {
      profile = {
        first_name: user.user_metadata.name || "",
        last_name: "",
        avatar_url: user.user_metadata.avatar_url || "",
      };
    }
  }

  return user ? (
    <div className="flex items-center justify-between gap-4 w-full">
      {/* Left */}
      <div className="flex gap-4 justify-start items-center w-full">
        <Button asChild size="sm" variant="ghost" className="p-4 rounded-full">
          <Link href="/">Home</Link>
        </Button>
        <Button asChild size="sm" variant="ghost" className="p-4 rounded-full">
          <Link href="/search">Search</Link>
        </Button>
      </div>

      {/* Middle */}
      <div className="flex gap-4 justify-center items-center font-semibold w-full">
        <Link href={"/"}>
          <Image
            src="/thatsaucelogoheader.png"
            alt="that sauce"
            width={200}
            height={200}
            priority
          />
        </Link>
      </div>

      {/* Right */}
      <div className="flex justify-end items-center w-full gap-2">
        {user.email?.includes("ohos.nyc") && (
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="p-4 rounded-full"
          >
            <Link href="/admin">Admin</Link>
          </Button>
        )}

        {/* Profile Avatar */}
        <Link href={`/${creatorUsername}`}>
          <Avatar className="">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>{profile.first_name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>

        {/* User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center cursor-pointer hover:text-primary transition-all duration-300 hover:bg-muted hover:rounded-full p-2">
              <ChevronDownIcon className="w-4 h-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="rounded-[16px] p-2 mt-4 border-none bg-zinc-200 dark:bg-zinc-800 flex flex-col gap-2 w-60"
            align="end"
          >
            <DropdownMenuGroup className="flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-700 px-2 py-4 rounded-[16px]">
              {/* avatar */}
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex justify-center items-center">
                  <Avatar className="w-16 h-16 border">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      {profile?.first_name?.charAt(0) ||
                        user.user_metadata.name?.charAt(0) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* name */}
                <div>
                  <p className="font-medium text-xl text-center">
                    {profile?.first_name ||
                      user.user_metadata.name ||
                      creatorUsername}{" "}
                    {profile?.last_name || ""}
                  </p>
                </div>
              </div>

              <DropdownMenuItem className="focus:bg-zinc-200 dark:focus:bg-zinc-600 rounded-[16px] p-4">
                <Link href={`/settings`} className="w-full text-sm font-medium">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-zinc-200 dark:focus:bg-zinc-600 rounded-[16px] p-4">
                <form
                  action={signOutAction}
                  className="w-full cursor-pointer text-sm font-medium"
                >
                  <button type="submit">Sign out</button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup className="flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-700 px-2 py-4 rounded-[16px]">
              <div className="px-4 flex justify-between items-center">
                <p className="text-sm font-medium">Theme</p>
                <ThemeSwitcher />
              </div>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-between gap-4 w-full">
      {/* Left */}
      <div className="flex gap-4 justify-start items-center w-full">
        <Button asChild size="sm" variant="ghost" className="p-4 rounded-full">
          <Link href="/">Home</Link>
        </Button>
        <Button asChild size="sm" variant="ghost" className="p-4 rounded-full">
          <Link href="/search">Search</Link>
        </Button>
      </div>

      {/* Middle */}
      <div className="flex gap-4 justify-center items-center font-semibold w-full">
        <Link href={"/"}>
          <Image
            src="/thatsaucelogoheader.png"
            alt="that sauce"
            width={200}
            height={200}
            priority
          />
        </Link>
      </div>

      {/* Right */}
      <div className="flex gap-2 justify-end items-center w-full">
        <ThemeSwitcher />
        <Button asChild variant="ghost" className="p-6 rounded-full">
          <Link href="/sign-in">Log in</Link>
        </Button>
        <Button asChild variant="default" className="px-4 py-2 rounded-full">
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
    </div>
  );
}
