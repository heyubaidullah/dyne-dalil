import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
  return (
    <PageStub
      eyebrow="Profile"
      title="Founder Demo"
      description="Your identity across every workspace. This is how teammates see you on decisions and outcomes."
      phase="Phase 4"
    >
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-teal-700 text-lg text-white">
                FD
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-display text-lg font-semibold">
                Founder Demo
              </p>
              <p className="text-sm text-muted-foreground">
                Demo account · seeded for the walkthrough
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" defaultValue="Founder Demo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="founder@dalil.app" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>Save changes</Button>
          </div>
        </CardContent>
      </Card>
    </PageStub>
  );
}
