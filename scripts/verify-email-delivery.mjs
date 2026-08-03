import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const parseEnvFile = (path) => {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map((match) => {
        const key = match[1];
        let value = match[2];
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        return [key, value];
      }),
  );
};

const localEnv = {
  ...parseEnvFile(resolve(".env")),
  ...parseEnvFile(resolve(".env.local")),
  ...process.env,
};
const resendApiKey = localEnv.RESEND_API_KEY || localEnv.VITE_RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("Clé Resend absente de l’environnement local.");
}

const jsonRequest = async (url, options = {}, label = "request") => {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(`${label} a échoué avec le statut ${response.status}.`);
  }
  return payload;
};

const createMailbox = async () => {
  const domains = await jsonRequest("https://api.mail.tm/domains?page=1", {}, "lecture des domaines de test");
  const domain = domains?.["hydra:member"]?.find((item) => item.isActive)?.domain;
  if (!domain) throw new Error("Aucun domaine de test e-mail disponible.");

  const password = `${randomBytes(18).toString("hex")}A!7`;
  const address = `spotted-delivery-${randomBytes(7).toString("hex")}@${domain}`;
  const account = await jsonRequest(
    "https://api.mail.tm/accounts",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password }),
    },
    "création de la boîte de test",
  );
  const token = await jsonRequest(
    "https://api.mail.tm/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password }),
    },
    "connexion à la boîte de test",
  );

  return { id: account.id, address, token: token.token };
};

const waitForMessage = async (mailbox, expectedSubject, timeoutMs = 45_000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const payload = await jsonRequest(
      "https://api.mail.tm/messages?page=1",
      { headers: { Authorization: `Bearer ${mailbox.token}` } },
      "lecture de la boîte de test",
    );
    const message = payload?.["hydra:member"]?.find((item) => item.subject === expectedSubject);
    if (message) return message;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 2_000));
  }
  return null;
};

let mailbox = null;
const result = {
  providerAccepted: false,
  externalMailboxReceived: false,
  cleanupComplete: false,
};

try {
  mailbox = await createMailbox();
  const subject = `Diagnostic Spotted Talent ${randomBytes(5).toString("hex")}`;

  await jsonRequest(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Spotted Talent <notifications@spottedtalent.fr>",
        to: [mailbox.address],
        subject,
        html: "<p>Vérification technique de la délivrabilité Spotted Talent.</p>",
      }),
    },
    "envoi Resend",
  );
  result.providerAccepted = true;
  result.externalMailboxReceived = Boolean(await waitForMessage(mailbox, subject));

  if (!result.externalMailboxReceived) {
    throw new Error("Le message n’a pas été reçu dans le délai prévu.");
  }
} finally {
  if (mailbox?.id && mailbox?.token) {
    await fetch(`https://api.mail.tm/accounts/${mailbox.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${mailbox.token}` },
    });
  }
  result.cleanupComplete = true;
  console.log(JSON.stringify(result));
}
