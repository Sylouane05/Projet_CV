import { onAuthStateChanged } from "firebase/auth";
import { firebaseServices } from "./firebase";
import { selectStorageScope } from "./db";
import { checkpointCloud, importBundle, loadLocalRecord } from "./storage";
import { CloudConflictError, restoreCloud, saveCloud } from "./cloud-backup";
import { SyncEngine } from "./sync-engine";
import { useAppStore } from "@/store/app-store";

export const cloudSync = new SyncEngine({
  selectScope: selectStorageScope,
  loadLocal: loadLocalRecord,
  loadRemote: restoreCloud,
  install: importBundle,
  checkpoint: checkpointCloud,
  save: saveCloud,
  isConflict: (error) => error instanceof CloudConflictError,
  render: (view) => {
    const old = useAppStore.getState();
    const activeVariantId = view.state?.resumeVariants.some((v) => v.id === old.activeVariantId)
      ? old.activeVariantId : view.state?.resumeVariants[0]?.id ?? null;
    useAppStore.setState({ ...view, activeVariantId, saveError: null });
  },
});
let started = false;
export function startCloudSync() {
  if (started) return;
  started = true;
  useAppStore.subscribe((value, previous) => {
    if (value.state !== previous.state) cloudSync.changed(value.state);
  });
  onAuthStateChanged(firebaseServices().auth, (user) => {
    void cloudSync.activate(user ? { uid: user.uid, email: user.email } : null);
  }, () => {
    useAppStore.setState({ state: null, account: null, loading: false, syncPhase: "error", syncMessage: "Impossible de vérifier la connexion. Recharge la page." });
  });
  window.addEventListener("online", () => {
    if (useAppStore.getState().syncPhase === "error") void cloudSync.retry();
  });
}
