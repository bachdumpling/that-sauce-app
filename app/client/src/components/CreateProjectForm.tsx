import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

interface CreateProjectFormProps {
  onSubmit: (title: string, description: string) => Promise<void>;
}

export function CreateProjectForm({ onSubmit }: CreateProjectFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset state
    setError(null);
    setSuccess(null);
    
    // Validate inputs
    if (!title.trim()) {
      setError("Project title is required");
      return;
    }
    
    if (!user) {
      setError("You must be logged in to create a project");
      return;
    }
    
    setIsCreating(true);
    
    try {
      await onSubmit(title, description);
      // Reset form on success
      setTitle("");
      setDescription("");
      setSuccess("Project created successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium">Create New Project</h3>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Input
          placeholder="Project Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isCreating || !user}
          required
        />
        
        <Textarea
          placeholder="Project Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isCreating || !user}
          rows={3}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={isCreating || !user || !title.trim()}
        className="w-full"
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Project"
        )}
      </Button>
      
      {!user && (
        <p className="text-sm text-muted-foreground text-center">
          You need to be logged in to create projects
        </p>
      )}
    </form>
  );
} 