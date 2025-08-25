import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Check if services already exist
  const existingServices = await prisma.service.findMany()
  
  if (existingServices.length === 0) {
    console.log('Creating default services...')
    
    const defaultServices = [
      {
        name: 'Μανικιρ Βασικό',
        description: 'Κλασικό μανικιρ με καθαρισμό, σχηματισμό και βερνίκι',
        duration: 45,
        price: 20.00,
        isactive: true
      },
      {
        name: 'Μανικιρ με Γαλλικό',
        description: 'Μανικιρ βασικό με γαλλικό σχέδιο',
        duration: 60,
        price: 30.00,
        isactive: true
      },
      {
        name: 'Πεντικιρ Βασικό',
        description: 'Κλασικό πεντικιρ με καθαρισμό, σχηματισμό και βερνίκι',
        duration: 60,
        price: 35.00,
        isactive: true
      },
      {
        name: 'Πεντικιρ με Γαλλικό',
        description: 'Πεντικιρ βασικό με γαλλικό σχέδιο',
        duration: 75,
        price: 45.00,
        isactive: true
      },
      {
        name: 'Αφαίρεση Βερνικιού Gel',
        description: 'Αφαίρεση gel βερνικιού με ειδικά προϊόντα',
        duration: 30,
        price: 15.00,
        isactive: true
      },
      {
        name: 'Gel Μανικιρ',
        description: 'Μανικιρ με gel βερνίκι για μακρά διάρκεια',
        duration: 90,
        price: 40.00,
        isactive: true
      },
      {
        name: 'Gel Πεντικιρ',
        description: 'Πεντικιρ με gel βερνίκι για μακρά διάρκεια',
        duration: 120,
        price: 55.00,
        isactive: true
      },
      {
        name: 'Spa Μανικιρ',
        description: 'Αναζωογονητικό μανικιρ με μάσκα και μασάζ',
        duration: 75,
        price: 45.00,
        isactive: true
      },
      {
        name: 'Spa Πεντικιρ',
        description: 'Αναζωογονητικό πεντικιρ με μάσκα και μασάζ',
        duration: 90,
        price: 60.00,
        isactive: true
      },
      {
        name: 'Διακόσμηση Νυχιών',
        description: 'Προσθήκη διακοσμητικών στοιχείων και σχέδια',
        duration: 30,
        price: 10.00,
        isactive: true
      },
      {
        name: 'Επισκευή Νυχιού',
        description: 'Επισκευή σπασμένου ή κατεστραμμένου νυχιού',
        duration: 45,
        price: 25.00,
        isactive: true
      },
      {
        name: 'Πακέτο Γαλλικό (Μανικιρ & Πεντικιρ)',
        description: 'Μανικιρ και πεντικιρ με γαλλικό σχέδιο',
        duration: 120,
        price: 70.00,
        isactive: true
      }
    ]

    for (const service of defaultServices) {
      await prisma.service.create({
        data: service
      })
    }

    console.log(`Created ${defaultServices.length} default services`)
  } else {
    console.log(`Found ${existingServices.length} existing services, skipping seed`)
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
