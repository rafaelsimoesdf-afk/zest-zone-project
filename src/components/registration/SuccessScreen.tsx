import { CheckCircle, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export const SuccessScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Cadastro Enviado com Sucesso!
            </h1>
            <p className="text-muted-foreground">
              Seu cadastro foi enviado e está em análise pela nossa equipe.
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-primary mb-2">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">Prazo para aprovação</span>
            </div>
            <p className="text-2xl font-bold text-foreground">Até 24 horas</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-left text-sm">
                <p className="font-medium text-foreground">Fique atento ao seu email</p>
                <p className="text-muted-foreground">
                  Você receberá uma notificação quando seu cadastro for aprovado ou se precisarmos de informações adicionais.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              className="w-full"
              onClick={() => navigate('/')}
            >
              Voltar para a Página Inicial
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => navigate('/browse')}
            >
              Explorar Veículos
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Enquanto aguarda a aprovação, você pode navegar pela plataforma e explorar os veículos disponíveis.
            Para alugar ou anunciar veículos, seu cadastro precisa estar aprovado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
