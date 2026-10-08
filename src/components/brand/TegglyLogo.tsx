import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Logo do Teggly que leva ao site oficial. Abre em outra aba para nao tirar a pessoa do app. */
export function TegglyLogo({
  arquivo = "Teggly_Logo_Primary.svg",
  width,
  height,
  className,
  linkClassName,
}: {
  arquivo?: string;
  width: number;
  height: number;
  className?: string;
  linkClassName?: string;
}) {
  return (
    <a
      href={`${SITE_URL}/`}
      target="_blank"
      rel="noopener"
      aria-label="Teggly, abrir o site"
      className={cn(
        "inline-flex rounded-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
        linkClassName,
      )}
    >
      <img
        src={`/brand/${arquivo}`}
        alt="Teggly"
        width={width}
        height={height}
        className={className}
      />
    </a>
  );
}
