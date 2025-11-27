import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Mic, BrainCircuit, BarChart3, Phone, Users, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import { VeritasLogo } from '@/components/icons';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/95 backdrop-blur-md sticky top-0 z-50 border-b shadow-sm">
        <Link href="#" className="flex items-center justify-center gap-2" prefetch={false}>
          <VeritasLogo className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold font-headline text-primary">AssureAI</span>
        </Link>
        <nav className="ml-auto flex gap-2 sm:gap-4 items-center">
          <Link 
            href="/login" 
            className="text-sm font-medium hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-accent" 
            prefetch={false}
          >
            Login
          </Link>
          <Button asChild size="sm" className="shadow-md">
            <Link href="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-20 lg:py-28 xl:py-36 bg-gradient-to-b from-background to-primary/5">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
                <div className="space-y-4">
                  <div className="inline-block">
                    <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                      🚀 AI-Powered Voice Calls
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-headline">
                    Intelligent Voice Assistant for{' '}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-600 to-purple-600">
                      Insurance
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto lg:mx-0 leading-relaxed">
                    AssureAI provides instant, accurate answers to your insurance queries. Make bulk calls, track conversations, and manage everything from one dashboard.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
                    <Link href="/register">
                      Try for Free
                      <span className="ml-2">→</span>
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="shadow-md">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-muted-foreground pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
              
              <div className="relative flex items-center justify-center lg:justify-end">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative p-8 rounded-2xl bg-card/50 backdrop-blur-sm border shadow-2xl">
                  <BrainCircuit className="h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 text-primary drop-shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 md:mb-16">
              <div className="space-y-3">
                <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary border border-primary/20">
                  ✨ Key Features
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-headline max-w-3xl">
                  A smarter way to handle insurance queries
                </h2>
                <p className="max-w-[800px] text-base md:text-lg text-muted-foreground leading-relaxed">
                  Our AI assistant is packed with features to make your life easier. From bulk voice calls to detailed analytics, we've got you covered.
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2 hover:border-primary/50 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                <CardHeader>
                  <div className="p-3 bg-blue-500/10 rounded-lg w-fit mb-2">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Bulk Voice Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Upload contact lists and make automated voice calls powered by AI. Track status and manage everything from one dashboard.</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2 hover:border-primary/50 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                <CardHeader>
                  <div className="p-3 bg-purple-500/10 rounded-lg w-fit mb-2">
                    <Mic className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Voice Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Advanced speech-to-text and natural language processing ensures high accuracy in understanding and responding to queries.</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2 hover:border-primary/50 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                <CardHeader>
                  <div className="p-3 bg-green-500/10 rounded-lg w-fit mb-2">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Real-time Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Comprehensive dashboard with insights into call history, transcripts, recordings, and detailed conversation analytics.</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2 hover:border-primary/50 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                <CardHeader>
                  <div className="p-3 bg-orange-500/10 rounded-lg w-fit mb-2">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl">User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Admin panel to manage users, roles, and permissions. Track user activity and maintain complete control.</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2 hover:border-primary/50 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                <CardHeader>
                  <div className="p-3 bg-cyan-500/10 rounded-lg w-fit mb-2">
                    <Zap className="h-6 w-6 text-cyan-600" />
                  </div>
                  <CardTitle className="text-xl">Instant Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Get immediate, accurate answers to insurance questions. AI-powered responses with natural conversation flow.</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2 hover:border-primary/50 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                <CardHeader>
                  <div className="p-3 bg-red-500/10 rounded-lg w-fit mb-2">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-xl">Secure & Private</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Enterprise-grade security with encrypted data storage. Your conversations and data are always protected.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-r from-primary to-blue-600 text-white">
          <div className="container px-4 md:px-6 mx-auto max-w-4xl text-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-headline">
                Ready to transform your insurance communication?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                Join thousands of users who trust AssureAI for intelligent voice assistance and bulk call management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" variant="secondary" asChild className="shadow-xl hover:shadow-2xl transition-shadow">
                  <Link href="/register">
                    Start Free Trial
                    <span className="ml-2">→</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <VeritasLogo className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} AssureAI. All rights reserved.
              </span>
            </div>
            <nav className="flex gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors" prefetch={false}>
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors" prefetch={false}>
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors" prefetch={false}>
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
