/**
 * Contact page with ClinicalRxQ support information
 * Refactored to use React Hook Form and Zod for validation.
 */
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Mail, 
  MessageCircle,
  Users,
  BookOpen,
  Video,
  Award,
  Headphones,
  CheckCircle,
  FileText,
  Lightbulb,
  Clock
} from 'lucide-react';
import SafeText from '../components/common/SafeText';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  pharmacyName: z.string().optional(),
  practiceSetting: z.string(),
  programsOfInterest: z.string(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const supportTypes = [
    // ... (supportTypes array is unchanged)
  ];

  const programHighlights = [
    // ... (programHighlights array is unchanged)
  ];

  const onSubmit = (data: ContactFormValues) => {
    console.log('Form submitted:', data);
    toast.success('Thank you for your inquiry! We will be in touch shortly.');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* ... (Hero section is unchanged) ... */}

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-5 w-5 text-cyan-500" />
                  <CardTitle>Get Started Today</CardTitle>
                </div>
                <p className="text-gray-600">
                  Tell us about your pharmacy and goals for clinical service expansion
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name *</label>
                      <Input placeholder="John" {...register('firstName')} />
                      {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name *</label>
                      <Input placeholder="Doe" {...register('lastName')} />
                      {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <Input type="email" placeholder="john@pharmacy.com" {...register('email')} />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input type="tel" placeholder="(555) 123-4567" {...register('phone')} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Pharmacy Name</label>
                    <Input placeholder="Community Care Pharmacy" {...register('pharmacyName')} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Practice Setting</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg" {...register('practiceSetting')}>
                      <option>Independent Community Pharmacy</option>
                      <option>Chain Community Pharmacy</option>
                      <option>Health System Outpatient Pharmacy</option>
                      <option>Specialty Pharmacy</option>
                      <option>Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Programs of Interest</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg" {...register('programsOfInterest')}>
                      <option>All Programs - Complete Ecosystem</option>
                      <option>MTM The Future Today</option>
                      <option>TimeMyMeds Synchronization</option>
                      <option>Test & Treat Services</option>
                      <option>HbA1c Testing</option>
                      <option>Pharmacist-Initiated Contraceptives</option>
                      <option>Medical Billing & Coding Training</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <Textarea 
                      placeholder="Tell us about your current practice challenges and goals for implementing clinical services..." 
                      rows={5}
                      {...register('message')}
                    />
                     {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-300 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-400"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* ... (Support Information section is unchanged) ... */}
          </div>
        </div>
      </section>

      {/* ... (Rest of the page is unchanged) ... */}

      <Footer />
    </div>
  );
}