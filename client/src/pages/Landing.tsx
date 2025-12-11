import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Phone, 
  ClipboardCheck, 
  Shield, 
  Calendar,
  ArrowRight,
  Heart
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Heart className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold">Admissions CRM</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Streamline Your Admissions Process
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              A simple, step-by-step CRM designed for addiction treatment centers. 
              Track inquiries, manage pipelines, and admit more clients with less effort.
            </p>
            <Button size="lg" className="text-lg px-8" asChild data-testid="button-get-started">
              <a href="/api/login">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>

        <section className="py-16 px-4 bg-card/50">
          <div className="container mx-auto max-w-6xl">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Everything You Need
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Call Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Log incoming calls instantly with caller info, referral source, and notes. 
                    Never lose a lead again.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <ClipboardCheck className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Pipeline View</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    See all inquiries at a glance. Track progress from first call 
                    to admission with clear stages.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Insurance VOB</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Collect insurance details and track verification status. 
                    Quote clients with confidence.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Easy Scheduling</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Schedule admissions and generate summaries automatically. 
                    Keep your team aligned.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              Designed for Simplicity
            </h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Large text, clear buttons, and a mobile-friendly design. 
              Your team can use it on any device without training.
            </p>
            <Button variant="outline" size="lg" asChild data-testid="button-learn-more">
              <a href="/api/login">
                Start Using Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground text-sm">
          <p>Admissions CRM for Addiction Treatment Centers</p>
        </div>
      </footer>
    </div>
  );
}
