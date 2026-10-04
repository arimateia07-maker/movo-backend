import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

function getServiceAccount(): ServiceAccount {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
  }

  const localPath = resolve(process.cwd(), "firebase-admin.json");
  if (existsSync(localPath)) {
    return JSON.parse(readFileSync(localPath, "utf8")) as ServiceAccount;
  }

  throw new Error(
    "Firebase Admin is not configured. Add firebase-admin.json locally or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
  );
}

const serviceAccount = getServiceAccount();
const firebaseAdminApp =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });

export const firebaseAdminAuth = getAuth(firebaseAdminApp);
