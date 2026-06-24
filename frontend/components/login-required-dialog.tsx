"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

interface LoginRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginRequiredDialog({ isOpen, onClose }: LoginRequiredDialogProps) {
  const router = useRouter();

  const handleLoginRedirect = () => {
    onClose();
    router.push("/login");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cần đăng nhập</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn cần đăng nhập để thực hiện hành động này.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleLoginRedirect}>Đăng nhập</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
