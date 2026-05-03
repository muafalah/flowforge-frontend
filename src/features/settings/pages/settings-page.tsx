import { ProfileForm } from "../components/profile-form";
import { DeleteAccountCard } from "../components/delete-account-card";

export function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Settings</h3>
        <p className="text-muted-foreground">
          Manage your account settings and profile information.
        </p>
      </div>
      <ProfileForm />
      <DeleteAccountCard />
    </div>
  );
}
