"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Creator } from "@/client/types";
import { useState, useEffect, useCallback } from "react";
import { checkUsernameAvailability } from "@/lib/api/client/creators";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { updateCreatorProfile } from "@/lib/api/client/creators";
// Simple debounce function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface EditUsernameFormProps {
  creator: Creator;
}

export function EditUsernameForm({ creator }: EditUsernameFormProps) {
  const [username, setUsername] = useState(creator.username);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const debouncedUsername = useDebounce(username, 1000);

  // Instagram-style username validation
  const validateUsername = (
    username: string
  ): { isValid: boolean; error: string | null } => {
    // Check for empty username
    if (!username) {
      return { isValid: false, error: "Username cannot be empty" };
    }

    // Check length (Instagram typically allows 1-30 characters)
    if (username.length > 30) {
      return {
        isValid: false,
        error: "Username must be less than 30 characters",
      };
    }

    // Check allowed characters (letters, numbers, periods, underscores)
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return {
        isValid: false,
        error:
          "Username can only contain letters, numbers, periods and underscores",
      };
    }

    // Check for consecutive periods
    if (username.includes("..")) {
      return {
        isValid: false,
        error: "Username cannot contain consecutive periods",
      };
    }

    // Check for starting or ending with period
    if (username.startsWith(".") || username.endsWith(".")) {
      return {
        isValid: false,
        error: "Username cannot start or end with a period",
      };
    }

    return { isValid: true, error: null };
  };

  const checkUsername = useCallback(
    async (usernameToCheck: string) => {
      if (!usernameToCheck || usernameToCheck === creator.username) {
        setIsAvailable(false);
        setError(null);
        setValidationError(null);
        return;
      }

      // Validate username first
      const validation = validateUsername(usernameToCheck);
      if (!validation.isValid) {
        setValidationError(validation.error);
        setIsAvailable(false);
        return;
      } else {
        setValidationError(null);
      }

      setIsLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await checkUsernameAvailability(usernameToCheck);
        setIsAvailable(response.available);
        setError(response.error || null);
      } catch (error) {
        setError(error as string);
      } finally {
        setIsLoading(false);
      }
    },
    [creator.username]
  );

  // Effect for checking username when debounced value changes
  useEffect(() => {
    if (hasTyped) {
      checkUsername(debouncedUsername);
    }
  }, [debouncedUsername, checkUsername, hasTyped]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    setHasTyped(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateCreatorProfile(creator.username, {
        username,
      });
      setSuccess(
        response.success ? "Username updated successfully" : response.error
      );
    } catch (error) {
      setError(error as string);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm h-[500px] flex flex-col justify-between p-4">
      <CardHeader className="flex flex-col justify-center items-center">
        <CardTitle>Claim your username</CardTitle>
        <CardDescription>
          Claim your username before it's taken.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative flex flex-col gap-2">
          <Input
            type="text"
            className="w-full py-6"
            value={username}
            placeholder="New username"
            onChange={handleUsernameChange}
            disabled={isLoading}
            required
          />
          <div>
            {isLoading && (
              <Loader2 className="absolute right-6 top-4 h-4 w-4 text-gray-500 animate-spin" />
            )}
            {success && (
              <CheckCircle className="absolute right-6 top-4 h-4 w-4 text-green-500" />
            )}
            {error && (
              <XCircle className="absolute right-6 top-4 h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        {validationError && (
          <div className="flex flex-row justify-center items-center gap-2 mt-2">
            <p className="text-sm text-red-500">{validationError}</p>
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
        {hasTyped &&
          username !== creator.username &&
          !isLoading &&
          !validationError && (
            <div className="flex flex-row justify-center items-center gap-2">
              <p className="text-sm text-gray-500">
                {isAvailable
                  ? "that-sauce.com/" + username
                  : "Username is already taken"}
              </p>
              {isAvailable ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
      </CardContent>

      <CardFooter>
        <div className="flex flex-col w-full justify-center items-center gap-2">
          <Button
            className="w-full cursor-pointer"
            disabled={
              !isAvailable ||
              isSubmitting ||
              username === creator.username ||
              !!validationError
            }
            onClick={() => {
              handleSave();
              console.log("clicked");
            }}
          >
            Save
          </Button>
          <Button variant="outline" className="w-full cursor-pointer">
            <Link href={`/${creator.username}`}>Cancel</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
