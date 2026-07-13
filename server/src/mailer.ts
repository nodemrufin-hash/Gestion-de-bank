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

/**
 * Envoie un email de bienvenue au client, une fois son adresse vérifiée.
 * Ne bloque jamais le flux : en cas d'absence d'identifiants ou d'erreur, on se
 * contente d'un message console.
 * @returns `{ sent }` — `true` si un email a réellement été expédié.
 */
export async function sendWelcomeEmail(
  to: string,
  firstName: string
): Promise<{ sent: boolean }> {
  if (!mailerConfigured()) {
    console.log(`[BIENVENUE] Email de bienvenue pour ${to} (Gmail non configuré — non envoyé)`);
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
      subject: "Bienvenue chez Libéo ! 🎉",
      text: `Bonjour ${firstName},\n\nVotre adresse a été vérifiée : votre compte Libéo est maintenant actif. Bienvenue !\n\nVous pouvez dès à présent vous connecter et profiter de vos comptes, faire des virements (internes ou Interac), payer vos factures, fixer des objectifs d'épargne et discuter avec notre assistant.\n\nAu plaisir de vous compter parmi nous,\n— L'équipe Libéo`,
      html: `<div style="font-family:Arial,sans-serif;color:#0f172a">
<h2 style="color:#1f4e6b">Bienvenue chez Libéo, ${firstName} ! 🎉</h2>
<p>Votre adresse a été vérifiée : votre compte est maintenant <strong>actif</strong>.</p>
<p>Vous pouvez dès à présent :</p>
<ul>
  <li>consulter vos comptes et vos soldes ;</li>
  <li>faire des virements internes ou Interac ;</li>
  <li>payer vos factures ;</li>
  <li>fixer des objectifs d'épargne ;</li>
  <li>échanger avec notre assistant.</li>
</ul>
<p>Au plaisir de vous compter parmi nous,<br>— L'équipe Libéo</p>
</div>`,
    });
    return { sent: true };
  } catch (e: any) {
    console.error("Échec de l'envoi de l'email de bienvenue:", e?.message || e);
    return { sent: false };
  }
}
