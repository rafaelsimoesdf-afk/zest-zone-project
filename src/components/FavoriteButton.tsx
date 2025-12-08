import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  vehicleId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'overlay';
}

export const FavoriteButton = ({ 
  vehicleId, 
  size = 'md', 
  className,
  variant = 'default'
}: FavoriteButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: favoriteIds = [] } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  
  const isFavorite = favoriteIds.includes(vehicleId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    toggleFavorite.mutate({ vehicleId, isFavorite });
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={toggleFavorite.isPending}
      className={cn(
        sizeClasses[size],
        'rounded-full transition-all duration-200',
        variant === 'overlay' 
          ? 'bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md' 
          : 'hover:bg-muted',
        isFavorite && 'text-red-500 hover:text-red-600',
        className
      )}
      aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart 
        size={iconSizes[size]} 
        className={cn(
          'transition-all duration-200',
          isFavorite && 'fill-current'
        )}
      />
    </Button>
  );
};
