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

  // Check if employees already exist
  const existingEmployees = await prisma.employee.findMany()
  
  if (existingEmployees.length === 0) {
    console.log('Creating default employees...')
    
    // Get all services for employee assignments
    const allServices = await prisma.service.findMany()
    
    const defaultEmployees = [
      {
        name: 'Μαρία Παπαδοπούλου',
        email: 'maria@nailsalon.gr',
        phone: '6901234567',
        specialties: 'Μανικιρ, Gel, Διακόσμηση',
        workingHours: '09:00-18:00',
        isActive: true,
        services: ['Μανικιρ Βασικό', 'Μανικιρ με Γαλλικό', 'Gel Μανικιρ', 'Spa Μανικιρ', 'Διακόσμηση Νυχιών', 'Επισκευή Νυχιού']
      },
      {
        name: 'Ελένη Γεωργίου',
        email: 'eleni@nailsalon.gr',
        phone: '6902345678',
        specialties: 'Πεντικιρ, Spa, Gel',
        workingHours: '10:00-19:00',
        isActive: true,
        services: ['Πεντικιρ Βασικό', 'Πεντικιρ με Γαλλικό', 'Gel Πεντικιρ', 'Spa Πεντικιρ', 'Πακέτο Γαλλικό (Μανικιρ & Πεντικιρ)']
      },
      {
        name: 'Σοφία Κωνσταντίνου',
        email: 'sofia@nailsalon.gr',
        phone: '6903456789',
        specialties: 'Όλες οι υπηρεσίες',
        workingHours: '08:00-17:00',
        isActive: true,
        services: allServices.map(s => s.name)
      }
    ]

    for (const employeeData of defaultEmployees) {
      // Create employee
      const employee = await prisma.employee.create({
        data: {
          name: employeeData.name,
          email: employeeData.email,
          phone: employeeData.phone,
          specialties: employeeData.specialties,
          workingHours: employeeData.workingHours,
          isActive: employeeData.isActive
        }
      })

      // Link employee to services
      for (const serviceName of employeeData.services) {
        const service = allServices.find(s => s.name === serviceName)
        if (service) {
          await prisma.employeeService.create({
            data: {
              employeeId: employee.id,
              serviceId: service.id
            }
          })
        }
      }
    }

    console.log(`Created ${defaultEmployees.length} default employees`)
  } else {
    console.log(`Found ${existingEmployees.length} existing employees, skipping seed`)
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
