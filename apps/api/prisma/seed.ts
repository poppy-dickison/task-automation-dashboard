import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.taskDefinition.upsert({
        where: { key: 'health_check' },
        update: {},
        create: {
            key: 'health_check',
            name: 'Health Check',
            description: 'Calls a public API and logs status/latency.'
        }
    });

    await prisma.taskDefinition.upsert({
        where: { key: 'csv_export' },
        update: {},
        create: {
            key: 'csv_export',
            name: 'CSV Export',
            description: 'Generates a small CSV report and stores it locally.'
        }
    });

    await prisma.taskDefinition.upsert({
        where: { key: 'data_sync' },
        update: {},
        create: {
            key: 'data_sync',
            name: 'Data Sync',
            description: 'Fetches paginated data from a public API and stores a summary.'
        }
    });
}

main()
    .then(async () => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
