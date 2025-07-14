import Link from 'next/link'
import { ArrowRight, Target, Shield, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-primary-700">
            Bike Fit Pro
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#features" className="text-gray-600 hover:text-primary-600">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-primary-600">How It Works</a>
            <a href="#faq" className="text-gray-600 hover:text-primary-600">FAQ</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Get a Pro Bike Fit—
          <span className="text-primary-600">From Home</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Upload a photo. Get your perfect fit. Ride pain-free with AI-powered bike fitting analysis.
        </p>
        <Link href="/onboarding" className="btn-primary inline-flex items-center text-lg">
          Start Your Free Fit
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
        <p className="text-sm text-gray-500 mt-4">
          No signup required • Results in minutes • Professional recommendations
        </p>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Bike Fit Pro?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <Target className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Precision Analysis</h3>
            <p className="text-gray-600">
              AI-powered pose detection analyzes your riding position with professional-grade accuracy.
            </p>
          </div>
          <div className="card text-center">
            <Shield className="h-12 w-12 text-secondary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Injury Prevention</h3>
            <p className="text-gray-600">
              Identify and fix posture issues before they cause pain, discomfort, or long-term injury.
            </p>
          </div>
          <div className="card text-center">
            <TrendingUp className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Better Performance</h3>
            <p className="text-gray-600">
              Optimize your aerodynamics and power transfer for faster, more efficient riding.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Take Photos</h3>
              <p className="text-gray-600">
                Capture side-view photos of yourself riding in 6 o'clock and 3 o'clock pedal positions.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes your posture and calculates key angles for optimal bike fit.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Results</h3>
              <p className="text-gray-600">
                Receive personalized recommendations and step-by-step adjustment guides.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Ride?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of cyclists who've improved their comfort and performance.
          </p>
          <Link href="/onboarding" className="btn-secondary bg-white text-primary-600 hover:bg-gray-50">
            Start Your Free Analysis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Bike Fit Pro</h3>
              <p className="text-gray-400">
                Professional bike fitting technology accessible to everyone.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#guides">Guides</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#privacy">Privacy</a></li>
                <li><a href="#terms">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Bike Fit Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 