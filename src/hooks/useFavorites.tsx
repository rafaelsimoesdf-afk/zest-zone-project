import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Favorite {
  id: string;
  user_id: string;
  vehicle_id: string;
  created_at: string;
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    year: number;
    daily_price: number;
    transmission_type: string;
    fuel_type: string;
    status: string;
    vehicle_images: { image_url: string; is_primary: boolean }[];
    addresses: { city: string; state: string } | null;
  };
}

export const useFavorites = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          vehicle:vehicles (
            id,
            brand,
            model,
            year,
            daily_price,
            transmission_type,
            fuel_type,
            status,
            vehicle_images (image_url, is_primary),
            addresses (city, state)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!user,
  });
};

export const useFavoriteIds = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorite-ids', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select('vehicle_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(f => f.vehicle_id);
    },
    enabled: !!user,
  });
};

export const useIsFavorite = (vehicleId: string) => {
  const { data: favoriteIds = [] } = useFavoriteIds();
  return favoriteIds.includes(vehicleId);
};

export const useToggleFavorite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vehicleId, isFavorite }: { vehicleId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('Usuário não autenticado');

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('vehicle_id', vehicleId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, vehicle_id: vehicleId });

        if (error) throw error;
      }
    },
    onSuccess: (_, { isFavorite }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-ids'] });
      toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
    },
    onError: () => {
      toast.error('Erro ao atualizar favoritos');
    },
  });
};

export const useRemoveFavorite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicleId: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('vehicle_id', vehicleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-ids'] });
      toast.success('Removido dos favoritos');
    },
    onError: () => {
      toast.error('Erro ao remover dos favoritos');
    },
  });
};
