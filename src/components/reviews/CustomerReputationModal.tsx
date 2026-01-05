import { Star, User, Calendar, Car, ThumbsUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCustomerReviews } from "@/hooks/useCustomerReviews";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomerReputationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  customerImage?: string | null;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "fill-accent text-accent"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
};

const RatingBreakdown = ({ reviews }: { reviews: { rating: number }[] }) => {
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="space-y-2">
      {ratingCounts.map(({ rating, count, percentage }) => (
        <div key={rating} className="flex items-center gap-2 text-sm">
          <span className="w-3 text-muted-foreground">{rating}</span>
          <Star className="w-3 h-3 fill-accent text-accent" />
          <Progress value={percentage} className="flex-1 h-2" />
          <span className="w-6 text-right text-muted-foreground">{count}</span>
        </div>
      ))}
    </div>
  );
};

export const CustomerReputationModal = ({
  open,
  onOpenChange,
  customerId,
  customerName,
  customerImage,
}: CustomerReputationModalProps) => {
  const { data: stats, isLoading } = useCustomerReviews(customerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={customerImage || undefined} />
              <AvatarFallback>
                {customerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{customerName}</h3>
              <p className="text-sm text-muted-foreground font-normal">
                Reputação do Locatário
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-muted/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <span className="text-2xl font-bold">
                    {stats?.average_rating.toFixed(1) || "0.0"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Nota média</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ThumbsUp className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {stats?.total_reviews || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Avaliações</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Car className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {stats?.total_trips || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Viagens</p>
              </div>
            </div>

            {/* Rating Breakdown */}
            {stats && stats.reviews.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Distribuição das Notas</h4>
                  <RatingBreakdown reviews={stats.reviews} />
                </div>
              </>
            )}

            <Separator />

            {/* Reviews List */}
            <div>
              <h4 className="font-medium mb-3">
                Avaliações ({stats?.total_reviews || 0})
              </h4>
              
              {!stats || stats.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Este locatário ainda não tem avaliações.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[250px] pr-4">
                  <div className="space-y-4">
                    {stats.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 rounded-xl bg-muted/30 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage
                                src={review.reviewer?.profile_image || undefined}
                              />
                              <AvatarFallback className="text-xs">
                                {review.reviewer?.first_name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {review.reviewer?.first_name}{" "}
                                {review.reviewer?.last_name?.charAt(0)}.
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(review.created_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
