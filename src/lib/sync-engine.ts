import type { AppState } from "./schema";
import type { ExportBundle } from "./storage";
import type { CloudPhoto } from "./cloud-backup";

export function syncErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case "storage/retry-limit-exceeded":
      return "Le transfert de la photo a dépassé le délai autorisé. La synchronisation en ligne n’a pas abouti. Vérifie la connexion et la configuration Firebase Storage, puis réessaie.";
    case "storage/bucket-not-found":
    case "storage/project-not-found":
    case "storage/no-default-bucket":
      return "Le stockage des photos n’est pas configuré. Vérifie l’activation de Firebase Storage et le nom du bucket du projet.";
    case "storage/quota-exceeded":
      return "Le stockage des photos est indisponible. Vérifie le quota et le forfait du projet Firebase.";
    case "storage/unauthorized":
      return "Le transfert de la photo est refusé. Vérifie les règles d’accès de Firebase Storage.";
    case "storage/unauthenticated":
      return "Reconnecte-toi pour synchroniser la photo.";
    case "permission-denied":
      return "La sauvegarde en ligne est refusée. Vérifie les règles d’accès de Firestore.";
    case "unavailable":
    case "auth/network-request-failed":
      return "La connexion au service est interrompue. Vérifie ton accès à Internet, puis réessaie.";
    default:
      return error instanceof Error ? error.message : "La synchronisation en ligne est indisponible. Réessaie dans quelques instants.";
  }
}

export type SyncPhase = "loading" | "local" | "pending" | "saving" | "saved" | "error" | "conflict";
export type Account = { uid: string; email: string | null };
type Remote = { bundle: ExportBundle; revision: string; photo: CloudPhoto };
type Local = { state: AppState; dirty: boolean; revision: string | null };
export type SyncView = { state: AppState | null; loading: boolean; account: Account | null; syncPhase: SyncPhase; syncMessage: string | null };
export interface SyncDependencies {
  selectScope(uid: string | null): void;
  loadLocal(uid: string | null): Promise<Local>;
  loadRemote(uid: string): Promise<Remote | null>;
  install(bundle: ExportBundle, uid: string, revision: string): Promise<AppState>;
  checkpoint(uid: string, revision: string, state: AppState): Promise<void>;
  save(uid: string, state: AppState, revision: string | null, photo: CloudPhoto): Promise<{ revision: string; photo: CloudPhoto }>;
  isConflict(error: unknown): boolean;
  render(view: SyncView): void;
}

/** One session, one debounced writer. Late completions cannot update another account. */
export class SyncEngine {
  private epoch = 0;
  private account: Account | null = null;
  private state: AppState | null = null;
  private revision: string | null = null;
  private photo: CloudPhoto = { id: null, path: null };
  private phase: SyncPhase = "loading";
  private ready = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private writingEpoch: number | null = null;
  private error: string | null = null;
  constructor(private deps: SyncDependencies, private delay = 1500) {}
  private show(phase: SyncPhase, loading = false) {
    this.phase = phase;
    this.deps.render({ state: this.state, account: this.account, loading, syncPhase: phase, syncMessage: this.error });
  }
  async activate(account: Account | null, discardLocal = false) {
    const epoch = ++this.epoch;
    clearTimeout(this.timer);
    this.account = account;
    this.state = null;
    this.ready = false;
    this.revision = null;
    this.photo = { id: null, path: null };
    this.error = null;
    this.deps.selectScope(account?.uid ?? null);
    this.show("loading", true);
    try {
      const local = await this.deps.loadLocal(account?.uid ?? null);
      if (epoch !== this.epoch) return;
      this.state = local.state;
      if (!account) { this.show("local"); return; }
      const remote = await this.deps.loadRemote(account.uid);
      if (epoch !== this.epoch) return;
      this.revision = remote?.revision ?? null;
      this.photo = remote?.photo ?? { id: null, path: null };
      if (local.dirty && !discardLocal) {
        if (local.revision !== this.revision) {
          this.error = "Le CV en ligne et les modifications de cet appareil ont changé. Choisis la version à conserver.";
          this.show("conflict"); return;
        }
        this.ready = true;
        this.show("pending"); this.schedule(); return;
      }
      if (remote) {
        const installed = await this.deps.install(remote.bundle, account.uid, remote.revision);
        if (epoch !== this.epoch) return;
        this.state = installed;
      } else if (discardLocal) {
        throw new Error("Aucune sauvegarde en ligne. Le CV local a été conservé.");
      }
      this.ready = true;
      this.show(remote ? "saved" : "local");
    } catch (error) {
      if (epoch !== this.epoch) return;
      this.error = syncErrorMessage(error);
      this.show("error");
    }
  }
  changed(state: AppState | null) {
    if (!state || this.state === state || this.phase === "loading") return;
    this.state = state;
    if (!this.account) { this.show("local"); return; }
    if (!this.ready || this.phase === "conflict") return;
    this.error = null;
    this.show("pending"); this.schedule();
  }
  private schedule() {
    clearTimeout(this.timer);
    const epoch = this.epoch;
    this.timer = setTimeout(() => { if (epoch === this.epoch) void this.saveNow(); }, this.delay);
  }
  async saveNow() {
    clearTimeout(this.timer);
    const epoch = this.epoch;
    if (!this.account || !this.state || this.phase === "conflict") return;
    if (!this.ready) { await this.activate(this.account); return; }
    if (this.writingEpoch === epoch) return;
    const uid = this.account.uid;
    const state = this.state;
    this.writingEpoch = epoch;
    this.error = null;
    this.show("saving");
    try {
      const saved = await this.deps.save(uid, state, this.revision, this.photo);
      // Checkpoint always uses the captured account, including after sign-out.
      await this.deps.checkpoint(uid, saved.revision, state);
      if (epoch !== this.epoch) return;
      this.revision = saved.revision;
      this.photo = saved.photo;
      if (this.state !== state) { this.show("pending"); this.schedule(); }
      else this.show("saved");
    } catch (error) {
      if (epoch !== this.epoch) return;
      clearTimeout(this.timer);
      this.ready = false;
      this.error = syncErrorMessage(error);
      this.show(this.deps.isConflict(error) ? "conflict" : "error");
    } finally { if (this.writingEpoch === epoch) this.writingEpoch = null; }
  }
  async useLocal() {
    if (!this.account) return;
    // Fetch the current revision; a transaction still guards any later change.
    const epoch = this.epoch;
    const remote = await this.deps.loadRemote(this.account.uid);
    if (epoch !== this.epoch) return;
    this.revision = remote?.revision ?? null;
    this.photo = remote?.photo ?? { id: null, path: null };
    this.ready = true;
    this.show("pending");
    await this.saveNow();
  }
  async reloadRemote() { await this.activate(this.account, true); }
  async retry() { await this.activate(this.account); }
  stop() { ++this.epoch; clearTimeout(this.timer); }
}
