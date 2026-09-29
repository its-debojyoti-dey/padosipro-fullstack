import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categoriesData = [
  {
    id: 'home',
    name: 'Home & Repairs',
    description: 'Maintenance, appliance servicing, electrical, plumbing, and deep cleaning for your home.',
    icon: 'home',
    tasks: [
      { name: 'AC servicing & installation', subcategory: 'Appliances & Utilities', description: 'Complete filter cleaning, gas recharge, and performance inspection.' },
      { name: 'Electrical work & appliance fixing', subcategory: 'Appliances & Utilities', description: 'Switchboard wiring, fuse repairs, and major appliance diagnostics.' },
      { name: 'Plumbing repairs & installations', subcategory: 'Repairs', description: 'Leak fixing, tap replacements, and water line inspections.' },
      { name: 'Deep cleaning & regular cleaning', subcategory: 'Cleaning', description: 'Comprehensive kitchen, bathroom, and full-flat deep sanitization.' },
      { name: 'Pest control coordination', subcategory: 'Appliances & Utilities', description: 'Safe herbal or chemical pest eradication for termites and roaches.' },
      { name: 'Furniture assembly', subcategory: 'Repairs', description: 'Flatpack furniture assembly, wardrobe alignment, and carpentry.' },
      { name: 'Water tank & motor maintenance', subcategory: 'Appliances & Utilities', description: 'Overhead tank cleaning and water pump motor health check.' },
    ],
  },
  {
    id: 'errands',
    name: 'Daily Errands & Pickups',
    description: 'Doorstep pickups, deliveries, groceries, and prescription medicine runs handled seamlessly.',
    icon: 'shopping-bag',
    tasks: [
      { name: 'Grocery pickup & restocking', subcategory: 'Pickups & Deliveries', description: 'Handpicked fresh produce, dairy, and household essentials.' },
      { name: 'Medicine pickup & refills', subcategory: 'Pickups & Deliveries', description: 'Pharmacy pickups, monthly prescription refills, and bill tracking.' },
      { name: 'Courier pickup/drop', subcategory: 'Pickups & Deliveries', description: 'Domestic/international parcel dispatch and doorstep drop.' },
      { name: 'Pet food & supplies pickup', subcategory: 'Pickups & Deliveries', description: 'Pet feed, grooming supplies, and vet medication runs.' },
      { name: 'Gift shopping & returns', subcategory: 'Shopping', description: 'Custom gift curation, wrapping, and retail exchange handling.' },
    ],
  },
  {
    id: 'health',
    name: 'Health & Senior Care',
    description: 'Personalized healthcare logistics, companion care, doctor appointments, and medical records.',
    icon: 'activity',
    tasks: [
      { name: 'Doctor appointment scheduling', subcategory: 'Medical Support', description: 'Top specialist discovery, slot booking, and OPD coordination.' },
      { name: 'Lab test coordination at home', subcategory: 'Daily Care', description: 'Diagnostic phlebotomist visit, blood draw, and digital report retrieval.' },
      { name: 'Hospital visit accompaniment', subcategory: 'Medical Support', description: 'Dedicated companion for OPD consultations, billing, and wheelchair aid.' },
      { name: 'Daily check-in visits', subcategory: 'Daily Care', description: 'Warm in-person or video check-in for senior family members living alone.' },
      { name: 'Medicine management & reminders', subcategory: 'Medical Support', description: 'Weekly pill organizer sorting and telephonic dosage follow-ups.' },
      { name: 'Health record organization', subcategory: 'Records & Reports', description: 'Digitizing, categorizing, and indexing past medical files.' },
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Local Transport',
    description: 'End-to-end trip curation, itinerary planning, airport transit, and on-trip assistance.',
    icon: 'compass',
    tasks: [
      { name: 'Train booking (Tatkal, waitlist handling)', subcategory: 'Book Travel', description: 'IRCTC quota optimization, Tatkal assistance, and status tracking.' },
      { name: 'Flight booking & rebooking', subcategory: 'Book Travel', description: 'Best airfare discovery, seat selection, and meal preferences.' },
      { name: 'Airport pickup/drop coordination', subcategory: 'Local Transport', description: 'Punctual verified chauffeur booking with flight delay tracking.' },
      { name: 'Itinerary planning & rescheduling', subcategory: 'Book Travel', description: 'Day-by-day customized travel route, hotel, and sightseeing booking.' },
      { name: 'Local cab & driver arrangement', subcategory: 'Local Transport', description: 'Full-day city cab with courteous vetted drivers.' },
    ],
  },
  {
    id: 'documents',
    name: 'Documents & Government',
    description: 'Physical queue standing, documentation, notarization, and official filings made painless.',
    icon: 'file-text',
    tasks: [
      { name: 'Queue standing (banks, govt offices, temples)', subcategory: 'Documents & Government', description: 'PadosiPro representative stands in long queues on your behalf.' },
      { name: 'Document printing, scanning, notarization', subcategory: 'Documents & Government', description: 'High-res printing, legal stamping, and doorstep courier delivery.' },
      { name: 'Passport photo & form assistance', subcategory: 'Documents & Government', description: 'Passport Seva Kendra appointment, annexure review, and biometric prep.' },
      { name: 'SIM replacement & activation help', subcategory: 'Documents & Government', description: 'Telco store KYC, eSIM transfer, and lost SIM card re-issuance.' },
    ],
  },
  {
    id: 'tech',
    name: 'Smart Home & Devices',
    description: 'Home Wi-Fi, smart electronics, phone backups, and personal cyber safety setup.',
    icon: 'cpu',
    tasks: [
      { name: 'Wi-Fi & router installation', subcategory: 'Internet & Home Tech', description: 'Dual-band mesh router setup, dead zone elimination, and ISP liaison.' },
      { name: 'Phone & laptop setup', subcategory: 'Device Setup', description: 'Data migration from old device, account linking, and security config.' },
      { name: 'Smart TV & home setup', subcategory: 'Device Setup', description: 'OTT apps, soundbar syncing, and casting setup.' },
      { name: 'Data backup & recovery', subcategory: 'Accounts & Data', description: 'Google Drive, iCloud, or external SSD automated backup.' },
    ],
  },
];

async function main() {
  console.log('Seeding PadosiPro categories and tasks...');

  for (const cat of categoriesData) {
    const { tasks, ...catData } = cat;

    await prisma.category.upsert({
      where: { id: catData.id },
      update: catData,
      create: catData,
    });

    for (const task of tasks) {
      // Find or create task
      const existing = await prisma.task.findFirst({
        where: { name: task.name, categoryId: catData.id },
      });

      if (!existing) {
        await prisma.task.create({
          data: {
            categoryId: catData.id,
            name: task.name,
            subcategory: task.subcategory,
            description: task.description,
          },
        });
      }
    }
  }

  const totalCategories = await prisma.category.count();
  const totalTasks = await prisma.task.count();
  console.log(`Seeding complete! ${totalCategories} categories, ${totalTasks} tasks seeded.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
