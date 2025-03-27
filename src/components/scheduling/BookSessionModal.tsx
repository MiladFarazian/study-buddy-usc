
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tutor } from "@/types/tutor";
import { NewBookingWizard } from "./NewBookingWizard";

interface BookSessionModalProps {
  tutor: Tutor;
  isOpen: boolean;
  onClose: () => void;
}

export const BookSessionModal = ({ tutor, isOpen, onClose }: BookSessionModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <NewBookingWizard 
          tutor={tutor} 
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
