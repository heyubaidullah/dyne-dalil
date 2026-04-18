import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Upload, ShieldCheck, BarChart3, Layers } from "lucide-react";

export default function ProfilePage() {
  return (
    <PageStub
      eyebrow="Profile"
      title="Founder Demo"
      description="Your identity across every workspace. This is how teammates see you on decisions and outcomes."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base">Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-teal-700 text-xl text-white">
                  FD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="font-display text-lg font-semibold">
                  Founder Demo
                </p>
                <p className="text-sm text-muted-foreground">
                  Solo founder · Austin, TX · logged 6 decisions this month
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Upload avatar
              </Button>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" defaultValue="Founder Demo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="handle">Display handle</Label>
                <Input id="handle" defaultValue="@founder" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue="founder@dalil.app" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select defaultValue="founder">
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Founder / CEO</SelectItem>
                    <SelectItem value="pm">Product manager</SelectItem>
                    <SelectItem value="pmm">Product marketer</SelectItem>
                    <SelectItem value="sales">Founder-led sales</SelectItem>
                    <SelectItem value="ops">Operator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tz">Time zone</Label>
                <Select defaultValue="america-chicago">
                  <SelectTrigger id="tz">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america-los_angeles">
                      America/Los_Angeles
                    </SelectItem>
                    <SelectItem value="america-denver">
                      America/Denver
                    </SelectItem>
                    <SelectItem value="america-chicago">
                      America/Chicago
                    </SelectItem>
                    <SelectItem value="america-new_york">
                      America/New_York
                    </SelectItem>
                    <SelectItem value="europe-london">Europe/London</SelectItem>
                    <SelectItem value="asia-dubai">Asia/Dubai</SelectItem>
                    <SelectItem value="asia-dhaka">Asia/Dhaka</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locale">Language</Label>
                <Select defaultValue="en-us">
                  <SelectTrigger id="locale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-us">English (US)</SelectItem>
                    <SelectItem value="en-gb">English (UK)</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="ur">اردو</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">
                Short bio
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  optional · shows next to your decisions
                </span>
              </Label>
              <Textarea
                id="bio"
                rows={3}
                defaultValue="Building the halal-first delivery stack for US campuses. Second-time founder. Muslim-student operator lens."
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost">Cancel</Button>
              <Button>Save changes</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <BarChart3 className="h-4 w-4 text-teal-700" />
                Your contribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Stat label="Memories confirmed" value="42" trend="+6 this week" />
              <Stat label="Decisions authored" value="11" trend="+2 this week" />
              <Stat
                label="Outcomes tracked"
                value="7"
                trend="67% win rate"
              />
              <Stat
                label="Ideas in the vault"
                value="4"
                trend="2 converted to workspace"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Layers className="h-4 w-4 text-teal-700" />
                Workspaces
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <WorkspaceRow
                name="Halal Delivery 0→1"
                role="Owner"
                last="today"
              />
              <WorkspaceRow
                name="Prayer-Time SaaS"
                role="Owner"
                last="yesterday"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SecurityRow label="Two-factor authentication" value="On" />
              <SecurityRow label="Last login" value="from Austin, TX · 2h ago" />
              <SecurityRow
                label="Password"
                value="Changed 38 days ago"
              />
              <Button variant="outline" size="sm" className="mt-1 w-full">
                Manage security
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageStub>
  );
}

function Stat({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-border pb-2 last:border-none last:pb-0">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="font-display text-xl font-semibold text-ink-950 dark:text-ink-50">
          {value}
        </p>
      </div>
      <span className="pb-0.5 text-xs text-muted-foreground">{trend}</span>
    </div>
  );
}

function WorkspaceRow({
  name,
  role,
  last,
}: {
  name: string;
  role: string;
  last: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          {role} · last active {last}
        </p>
      </div>
      <Badge variant="outline" className="shrink-0 font-normal">
        {role}
      </Badge>
    </div>
  );
}

function SecurityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-ink-950 dark:text-ink-50">{value}</span>
    </div>
  );
}
