"use client";

import * as React from "react";
import { X, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export type Option = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select options",
  className,
  emptyMessage = "No options found.",
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];
  // Ensure selected is always an array
  const safeSelected = Array.isArray(selected) ? selected : [];

  const handleUnselect = (item: string) => {
    onChange(safeSelected.filter((i) => i !== item));
  };

  const handleSelect = (value: string) => {
    if (safeSelected.includes(value)) {
      onChange(safeSelected.filter((item) => item !== value));
    } else {
      onChange([...safeSelected, value]);
    }
  };

  // Filter options based on search query
  const filteredOptions = safeOptions.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create a simple badge for each selected item
  const renderSelectedItems = () => {
    if (safeSelected.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {safeSelected.map((item) => {
          const label =
            safeOptions.find((option) => option.value === item)?.label || item;
          return (
            <Badge
              key={item}
              variant="default"
              className="mr-1 py-2 px-3 text-xs"
            >
              {label}
              <div
                className="ml-2 rounded-full cursor-pointer hover:text-primary-foreground/80 text-primary-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnselect(item);
                }}
              >
                <X className="h-3 w-3" />
              </div>
            </Badge>
          );
        })}
      </div>
    );
  };

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between px-4 py-4", className)}
          onClick={() => setOpen(!open)}
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap">{renderSelectedItems()}</div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="p-4">
          <Input
            placeholder="Search options..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
          <ScrollArea className="h-60">
            {filteredOptions.length > 0 ? (
              <div className="space-y-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                      safeSelected.includes(option.value) &&
                        "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleSelect(option.value)}
                  >
                    <div className="h-4 w-4 flex items-center justify-center">
                      {safeSelected.includes(option.value) && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
