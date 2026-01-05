import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateReview, useUpdateReview, useExistingReview } from "@/hooks/useReviews";

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  reviewerId: string;
  reviewedId: string;
  reviewedName: string;
}

export const ReviewForm = ({
  open,
  onOpenChange,
  bookingId,
  reviewerId,
  reviewedId,
  reviewedName,
}: ReviewFormProps) => {
  const { data: existingReview, isLoading: loadingReview } = useExistingReview(
    bookingId,
    reviewerId
  );

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  useEffect(() => {
    if (!open) return;
    setRating(existingReview?.rating ?? 0);
    setComment(existingReview?.comment ?? "");
  }, [existingReview, open]);

  const handleSubmit = async () => {
    if (rating === 0) return;

    if (existingReview) {
      await updateReview.mutateAsync({
        reviewId: existingReview.id,
        rating,
        comment,
      });
    } else {
      await createReview.mutateAsync({
        bookingId,
        reviewerId,
        reviewedId,
        rating,
        comment,
      });
    }

    onOpenChange(false);
  };

  const isSubmitting = createReview.isPending || updateReview.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? "Editar Avaliação" : `Avaliar ${reviewedName}`}
          </DialogTitle>
          <DialogDescription>
            {existingReview
              ? `Atualize sua avaliação para ${reviewedName}`
              : `Como foi sua experiência com ${reviewedName}?`}
          </DialogDescription>
        </DialogHeader>

        {loadingReview ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Star Rating */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? "fill-accent text-accent"
                          : "fill-muted text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {rating === 0
                  ? "Selecione uma nota"
                  : rating === 1
                  ? "Muito ruim"
                  : rating === 2
                  ? "Ruim"
                  : rating === 3
                  ? "Regular"
                  : rating === 4
                  ? "Bom"
                  : "Excelente"}
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Comentário (opcional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte como foi sua experiência..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {comment.length}/500 caracteres
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting
              ? "Enviando..."
              : existingReview
              ? "Atualizar"
              : "Enviar Avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
