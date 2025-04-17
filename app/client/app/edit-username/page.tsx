import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { EditUsernameForm } from "./components/edit-username-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function EditUsernamePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("username")
    .eq("profile_id", user.id)
    .single();

  if (!creator) {
    redirect("/");
  } else {
    return (
      <div className="">
        <Button variant="outline">
          <Link href={`/${creator.username}`}>
            <div className="flex flex-row items-center justify-center">
              <ArrowLeft className="h-4 w-4 mr-2 mb-1" />
              Back to profile
            </div>
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center mt-20">
          <EditUsernameForm creator={creator} />
        </div>
      </div>
    );
  }
}
