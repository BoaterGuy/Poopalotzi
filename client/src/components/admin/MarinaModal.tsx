import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MarinaForm from "./MarinaForm";

interface MarinaModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMarina?: {
    id: number;
    name: string;
    address: string;
    phone: string;
    isActive: boolean;
  };
}

export default function MarinaModal({ isOpen, onClose, existingMarina }: MarinaModalProps) {
  const isEditing = !!existingMarina;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0B1F3A]">
            {isEditing ? "Edit Marina" : "Add New Marina"}
          </DialogTitle>
        </DialogHeader>
        <MarinaForm onClose={onClose} existingMarina={existingMarina} />
      </DialogContent>
    </Dialog>
  );
}