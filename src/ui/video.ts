/**
 * Encodage video de l'animation, en MP4.
 *
 * Seul module du projet a dependre d'autre chose que Vue, et il le fait en import
 * DYNAMIQUE : mediabunny pese 43 ko gzip en import statique, soit plus que les
 * 34 ko qui avaient fait ecarter `vue-i18n` au profit d'une couche maison. Charge
 * a la demande, il ne coute que 0,7 ko au chargement du site et n'arrive que le
 * jour ou quelqu'un exporte une video.
 *
 * Ecrire le conteneur a la main comme pour le GIF et le WebP n'etait pas tenable
 * ici : un MP4 demande tout l'arbre de boites ISO BMFF et ses tables
 * d'echantillons, la ou un GIF tient en quelques centaines de lignes.
 *
 * La video est forcement OPAQUE. Verifie sur place : `VideoEncoder` refuse
 * `alpha: 'keep'`, en H.264 comme en VP9. C'est pour ca que l'export video impose
 * un fond, la ou le GIF laisse le choix.
 */

import { arrete } from './export'

/**
 * QUANTISEUR explicite, et pas un niveau `QUALITY_*`.
 *
 * Ce n'est pas un detail de reglage, c'est la clef de la qualite ici. Les niveaux
 * nommes de mediabunny ne fixent PAS de debit : quand le navigateur sait encoder
 * a quantiseur fixe — Chrome 117 et au-dela pour tous ces codecs — ils se
 * traduisent en `bitrateMode: 'quantizer'` et le debit calcule ne sert qu'a
 * choisir le niveau AVC de la chaine de codec. `QUALITY_HIGH` posait donc un QP de
 * 22, et augmenter un debit n'y aurait rien change.
 *
 * Mesure sur une image du bot, erreur au bord contre la source :
 * QP 22 → 3,06 · QP 16 → 1,75 · QP 10 → 0,58. On prend 12, presque transparent,
 * pour environ 50 % d'octets de plus qu'a 22 — un export offline n'a pas de
 * contrainte de taille, et c'est le bord des formes qui fait toute l'impression
 * de proprete.
 *
 * Le debit accompagne le quantiseur comme REPLI : si un navigateur ne sait pas
 * encoder a quantiseur fixe, mediabunny bascule dessus au lieu d'echouer. Six
 * megabits pour du 1024 a 30 images est genereux sur des aplats.
 */
const QP = 12
const DEBIT_REPLI = 6_000_000

export type VideoExportFormat = 'mp4' | 'webm'
export type VideoExportQuality = 'standard' | 'high'

/**
 * Encode une suite d'images en MP4.
 *
 * `rend` dessine l'image `i` DANS le canvas fourni, puis rend la main. Les images
 * ne sont jamais accumulees : chacune est encodee et jetee avant la suivante,
 * sans quoi un cycle de trente secondes tiendrait 255 Mo de pixels bruts en
 * memoire.
 */
export async function versMp4(
  canvas: HTMLCanvasElement,
  images: number,
  fps: number,
  rend: (index: number) => void | Promise<void>,
  avance?: (fait: number, total: number) => void,
  /** Abandon demande par l'utilisateur. Cf. `arrete` ci-dessous. */
  signal?: AbortSignal
): Promise<Blob> {
  return versVideo(canvas, images, fps, rend, 'mp4', 'high', avance, signal)
}

/** Encodes MP4/H.264 or WebM/VP9 while keeping memory bounded to one canvas frame. */
export async function versVideo(
  canvas: HTMLCanvasElement,
  images: number,
  fps: number,
  rend: (index: number) => void | Promise<void>,
  format: VideoExportFormat,
  quality: VideoExportQuality,
  avance?: (fait: number, total: number) => void,
  signal?: AbortSignal
): Promise<Blob> {
  const { BufferTarget, CanvasSource, Mp4OutputFormat, Output, Quality, WebMOutputFormat } =
    await import('mediabunny')

  const sortie = new Output({
    format: format === 'mp4' ? new Mp4OutputFormat() : new WebMOutputFormat(),
    target: new BufferTarget()
  })
  const quantizer = quality === 'high' ? QP : 20
  const fallbackBitrate = quality === 'high' ? DEBIT_REPLI : 3_000_000
  const source = new CanvasSource(canvas, {
    codec: format === 'mp4' ? 'avc' : 'vp9',
    quality: new Quality({ quantizer, bitrate: fallbackBitrate })
  })
  sortie.addVideoTrack(source, { frameRate: fps })
  await sortie.start()

  /*
   * A partir d'ici l'encodeur est OUVERT, donc tout chemin de sortie doit passer par
   * `cancel`. Sans ca, une image qui echoue a se rendre laissait le `VideoEncoder`
   * derriere elle : Chrome plafonne le nombre d'encodeurs materiels simultanes, si bien
   * qu'apres quelques echecs les exports suivants tombaient a `start()` pour une raison
   * qui n'avait plus rien a voir avec la cause reelle. Le lecteur hors ecran de
   * `capture.ts` est ferme dans un `finally` pour la meme raison ; l'encodeur n'avait pas
   * son equivalent.
   */
  try {
    const duree = 1 / fps
    for (let i = 0; i < images; i++) {
      arrete(signal)
      await rend(i)
      // `await` sur chaque image et non en lot : c'est ce qui applique la
      // contre-pression de l'encodeur, donc ce qui borne la memoire.
      await source.add(i * duree, duree)
      avance?.(i + 1, images)
    }
    arrete(signal)

    await sortie.finalize()
    const buffer = sortie.target.buffer
    if (!buffer) throw new Error('encodage video vide')
    return new Blob([buffer], { type: format === 'mp4' ? 'video/mp4' : 'video/webm' })
  } catch (e) {
    await sortie.cancel()
    throw e
  }
}
