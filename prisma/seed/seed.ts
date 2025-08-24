import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Καλλωπισμός & Μανικιούρ',
        description: 'Κλασικός καλλωπισμός και μανικιούρ',
        duration: 90,
        price: 45
      }
    }),
    prisma.service.create({
      data: {
        name: 'Βαφή Γαλλικό Μανικιούρ',
        description: 'Βαφή με γαλλικό στυλ',
        duration: 60,
        price: 35
      }
    }),
    prisma.service.create({
      data: {
        name: 'Πεντικιούρ',
        description: 'Κλασικό πεντικιούρ',
        duration: 60,
        price: 40
      }
    }),
    prisma.service.create({
      data: {
        name: 'Ακρυλικά Νύχια',
        description: 'Επέκταση με ακρυλικό υλικό',
        duration: 120,
        price: 60
      }
    }),
    prisma.service.create({
      data: {
        name: 'Gel Νύχια',
        description: 'Επέκταση με gel υλικό',
        duration: 150,
        price: 70
      }
    })
  ])

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Μαρία Παπαδοπούλου',
        phone: '6912345678',
        email: 'maria@example.com',
        preferences: 'Προτιμά ροζ χρώματα, ευαίσθητη επιδερμίδα'
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Ελένη Νικολάου',
        phone: '6987654321',
        email: 'eleni@example.com',
        preferences: 'Αγαπά τα γαλλικά νύχια, προτιμά κοντό μήκος'
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Αννα Γεωργίου',
        phone: '6955555555',
        email: 'anna@example.com',
        preferences: 'Προτιμά φυσικό χρώμα, δεν θέλει ακρυλικά'
      }
    })
  ])

  // Create sample appointments
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  await Promise.all([
    prisma.appointment.create({
      data: {
        customerId: customers[0].id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
        status: 'SCHEDULED',
        totalDuration: 90,
        totalPrice: 45,
        services: {
          create: {
            serviceId: services[0].id
          }
        }
      }
    }),
    prisma.appointment.create({
      data: {
        customerId: customers[1].id,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
        status: 'SCHEDULED',
        totalDuration: 60,
        totalPrice: 35,
        services: {
          create: {
            serviceId: services[1].id
          }
        }
      }
    }),
    prisma.appointment.create({
      data: {
        customerId: customers[2].id,
        date: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0),
        status: 'SCHEDULED',
        totalDuration: 120,
        totalPrice: 60,
        services: {
          create: {
            serviceId: services[3].id
          }
        }
      }
    })
  ])

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