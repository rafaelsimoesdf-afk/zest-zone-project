import { useAuth } from "@/contexts/AuthContext";
import { useMyListings, useUpdateListing, useDeleteListing } from "@/hooks/useClassifieds";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pause, Play, Eye, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrencyBRL } from "@/lib/validators";

const statusLabels: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  sold: "Vendido",
  expired: "Expirado",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-700 border-green-500/30",
  paused: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  sold: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  expired: "bg-muted text-muted-foreground",
};

const MyListings = () => {
  const { user } = useAuth();
  const { data: listings, isLoading } = useMyListings();
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    updateListing.mutate({ id, status: newStatus });
  };

  const handleMarkSold = (id: string) => {
    updateListing.mutate({ id, status: "sold" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-primary">
              Meus Anúncios
            </h1>
            <Button asChild size="sm" className="w-fit">
              <Link to="/classifieds/create">
                <Plus className="w-4 h-4 mr-2" />
                Novo Anúncio
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <p className="text-muted-foreground">Carregando anúncios...</p>
              </CardContent>
            </Card>
          ) : !listings || listings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Tag className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum anúncio</h3>
                <p className="text-muted-foreground mb-6">Comece a vender seus veículos!</p>
                <Button asChild>
                  <Link to="/classifieds/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Anúncio
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
              {listings.map((listing) => {
                const primaryImage = listing.listing_images?.find(img => img.is_primary) || listing.listing_images?.[0];

                return (
                  <Card key={listing.id}>
                    {primaryImage && (
                      <Link to={`/classifieds/${listing.id}`}>
                        <div className="relative h-36 sm:h-48 overflow-hidden">
                          <img src={primaryImage.image_url} alt={`${listing.brand} ${listing.model}`} className="w-full h-full object-cover" />
                          <Badge className={`absolute top-2 right-2 sm:top-4 sm:right-4 text-xs ${statusColors[listing.status] || ""}`}>
                            {statusLabels[listing.status] || listing.status}
                          </Badge>
                        </div>
                      </Link>
                    )}
                    <CardHeader className="p-3 sm:p-6 pb-2">
                      <CardTitle className="text-base sm:text-lg">{listing.brand} {listing.model} {listing.year}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">{listing.color} • {(listing.mileage / 1000).toFixed(0)}k km</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-lg text-primary">{formatCurrencyBRL(listing.sale_price)}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" /> {listing.views_count}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleToggleStatus(listing.id, listing.status)} disabled={updateListing.isPending || listing.status === "sold"}>
                          {listing.status === "active" ? <><Pause className="w-3 h-3 mr-1" />Pausar</> : <><Play className="w-3 h-3 mr-1" />Reativar</>}
                        </Button>
                        {listing.status !== "sold" && (
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => handleMarkSold(listing.id)} disabled={updateListing.isPending}>
                            Marcar como vendido
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs text-destructive" disabled={deleteListing.isPending}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
                              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteListing.mutate(listing.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyListings;
