import { useSignedUrl } from "@/hooks/useSignedUrl";
import { AlertTriangle, ExternalLink } from "lucide-react";

interface SecureDocumentImageProps {
  url: string | null;
  label: string;
}

const SecureDocumentImage = ({ url, label }: SecureDocumentImageProps) => {
  const signedUrl = useSignedUrl(url);

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center p-4 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 min-h-[200px]">
        <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="text-sm text-muted-foreground">{label} não enviado</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <a
        href={signedUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="relative group"
      >
        <img
          src={signedUrl || ""}
          alt={label}
          className="w-full h-48 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
          <ExternalLink className="h-8 w-8 text-white" />
        </div>
      </a>
    </div>
  );
};

export default SecureDocumentImage;
