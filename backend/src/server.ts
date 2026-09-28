import app from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const PORT = env.PORT || 4000;

async function main() {
    try{
        await prisma.$connect();
        console.log("Connected to the database successfully.");
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch(err){
        console.error("Error occurred while starting the server:", err);
        await prisma.$disconnect();
        process.exit(1);
    }
}
main();