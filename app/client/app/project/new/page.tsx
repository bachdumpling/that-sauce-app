import React from "react";
import NewProjectForm from "../components/new-project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">Create New Project</h1>
      <NewProjectForm />
    </div>
  );
}
