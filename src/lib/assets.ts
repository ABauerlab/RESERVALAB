import { supabase } from "@/integrations/supabase/client";

/**
 * Imagens da empresa (banner do Link Hub e icones proprios). O arquivo e reduzido e convertido para
 * WebP no navegador antes do envio, entao ate uma foto grande do celular vira poucos KB e carrega
 * rapido no mobile. Fica no bucket `tenant-assets`, na pasta do proprio tenant (RLS de storage).
 */

export const BUCKET = "tenant-assets";
export type TipoImagem = "banner" | "icone";

export const MEDIDAS: Record<TipoImagem, { largura: number; altura: number; qualidade: number }> = {
  /** 3:1, boa leitura em 320 px e nitido em tela grande. */
  banner: { largura: 1200, altura: 400, qualidade: 0.82 },
  icone: { largura: 128, altura: 128, qualidade: 0.9 },
};

const TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/webp"];
const MAX_ENTRADA = 10 * 1024 * 1024;

export type Corte = { sx: number; sy: number; sw: number; sh: number };

/** Recorte central (banner, "cover") que preenche o destino sem distorcer. */
export function recorteCover(srcW: number, srcH: number, dstW: number, dstH: number): Corte {
  const alvo = dstW / dstH;
  const atual = srcW / srcH;
  if (atual > alvo) {
    const sw = Math.round(srcH * alvo);
    return { sx: Math.round((srcW - sw) / 2), sy: 0, sw, sh: srcH };
  }
  const sh = Math.round(srcW / alvo);
  return { sx: 0, sy: Math.round((srcH - sh) / 2), sw: srcW, sh };
}

/** Caber inteiro no destino ("contain", icones), mantendo a proporcao. */
export function medidasContain(srcW: number, srcH: number, dstW: number, dstH: number) {
  const k = Math.min(dstW / srcW, dstH / srcH);
  const w = Math.max(1, Math.round(srcW * k));
  const h = Math.max(1, Math.round(srcH * k));
  return { x: Math.round((dstW - w) / 2), y: Math.round((dstH - h) / 2), w, h };
}

export function validarArquivo(file: { type: string; size: number }): string | null {
  if (!TIPOS_ACEITOS.includes(file.type)) return "Use uma imagem PNG, JPG ou WebP.";
  if (file.size > MAX_ENTRADA) return "A imagem passa de 10 MB. Escolha uma menor.";
  return null;
}

async function processar(file: File, tipo: TipoImagem): Promise<Blob> {
  const { largura, altura, qualidade } = MEDIDAS[tipo];
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponivel");
  if (tipo === "banner") {
    const c = recorteCover(bmp.width, bmp.height, largura, altura);
    ctx.drawImage(bmp, c.sx, c.sy, c.sw, c.sh, 0, 0, largura, altura);
  } else {
    const m = medidasContain(bmp.width, bmp.height, largura, altura);
    ctx.drawImage(bmp, m.x, m.y, m.w, m.h);
  }
  bmp.close();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("falha ao converter"))),
      "image/webp",
      qualidade,
    ),
  );
}

/** Envia a imagem reduzida e devolve a URL publica (https). */
export async function enviarImagemDaEmpresa(
  tenantId: string,
  tipo: TipoImagem,
  file: File,
): Promise<string> {
  const erro = validarArquivo(file);
  if (erro) throw new Error(erro);
  const blob = await processar(file, tipo);
  const caminho = `${tenantId}/${tipo}-${Date.now()}.webp`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
}
