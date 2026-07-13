/**
 * Envoi d'emails (vérification d'adresse) via Gmail SMTP (Nodemailer).
 *
 * Configuration par variables d'environnement :
 *   - GMAIL_USER          : l'adresse Gmail expéditrice (ex: moncompte@gmail.com)
 *   - GMAIL_APP_PASSWORD  : un « mot de passe d'application » Gmail (16 caractères,
 *                           généré depuis les paramètres de sécurité Google avec
 *                           la validation en deux étapes activée).
 *
 * Si ces variables ne sont pas définies, l'email n'est pas envoyé : le code est
 * plutôt affiché dans la console du serveur (mode démonstration), pour que le
 * flux reste testable sans configurer de compte Gmail.
 */
import nodemailer from "nodemailer";

/** Indique si les identifiants Gmail sont configurés. */
export function mailerConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

/**
 * Envoie le code de vérification à l'adresse indiquée.
 * @returns `{ sent }` — `true` si un email a réellement été expédié, `false` en
 *          mode démonstration (identifiants absents ou erreur d'envoi).
 */
export async function sendVerificationEmail(
  to: string,
  firstName: string,
  code: string
): Promise<{ sent: boolean }> {
  // Mode démonstration : pas d'identifiants -> on affiche le code au serveur.
  if (!mailerConfigured()) {
    console.log(
      `[VÉRIFICATION] Code pour ${to} : ${code} (Gmail non configuré — email non envoyé)`
    );
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Banque Libéo" <${process.env.GMAIL_USER}>`,
      to,
      subject: "Votre code de vérification Libéo",
      text: `Bonjour ${firstName},\n\nVotre code de vérification est : ${code}\nIl est valable 15 minutes.\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\n— L'équipe Libéo`,
      html: `<p>Bonjour ${firstName},</p>
<p>Votre code de vérification est :</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>
<p>Il est valable 15 minutes.</p>
<p style="color:#64748b;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
<p>— L'équipe Libéo</p>`,
    });
    return { sent: true };
  } catch (e: any) {
    // On ne bloque pas l'inscription si l'envoi échoue : repli console.
    console.error("Échec de l'envoi de l'email de vérification:", e?.message || e);
    console.log(`[VÉRIFICATION] Code pour ${to} : ${code} (envoi échoué — repli console)`);
    return { sent: false };
  }
}
