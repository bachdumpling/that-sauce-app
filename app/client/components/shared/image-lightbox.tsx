"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import Image from "next/image";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageAlt?: string;
}

export function ImageLightbox({
  isOpen,
  onClose,
  imageUrl,
  imageAlt = "Image fullscreen view",
}: ImageLightboxProps) {
  // Close on escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-lg w-[95vw] h-[90vh] p-0 border-none bg-transparent">
        <div className="relative w-full h-full flex items-center justify-center">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-50 bg-black/70 hover:bg-black text-white p-2 rounded-full"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="relative w-full h-full max-h-[90vh]">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 