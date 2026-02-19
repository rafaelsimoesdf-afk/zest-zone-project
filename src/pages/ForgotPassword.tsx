import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof schema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setEmailSent(data.email);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-4">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Email enviado!</CardTitle>
            <CardDescription className="text-base mt-2">
              Enviamos um link de recuperação para
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted px-4 py-3 font-medium text-foreground">
              {emailSent}
            </div>
            <p className="text-sm text-muted-foreground">
              Clique no link do email para redefinir sua senha. Verifique também sua pasta de spam.
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
          <CardDescription>
            Informe seu email e enviaremos um link para redefinir sua senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                placeholder="seu@email.com"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar link de recuperação'
              )}
            </Button>

            <Button variant="ghost" className="w-full" onClick={() => navigate('/auth')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
