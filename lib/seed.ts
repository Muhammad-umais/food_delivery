import { ID, Query } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";
import * as FileSystem from "expo-file-system/legacy";

const FILESYSTEM_DIR = FileSystem.cacheDirectory || "file:///tmp/";
const FAILED_ITEMS_FILE = `${FILESYSTEM_DIR}failedItems.json`;

interface Category { name: string; description: string; }
interface Customization { name: string; price: number; type: "topping"|"side"|"size"|"crust"|string; }
interface MenuItem {
    name: string; description: string; image_url: string; price: number; rating: number;
    calories: number; protein: number; category_name: string; customizations: string[];
}
interface DummyData { categories: Category[]; customizations: Customization[]; menu: MenuItem[]; }

const data = dummyData as DummyData;

// ----------------------------
// Load failed items from last run
// ----------------------------
async function loadFailedItems(): Promise<MenuItem[]> {
    try {
        const content = await FileSystem.readAsStringAsync(FAILED_ITEMS_FILE);
        const names: string[] = JSON.parse(content);
        return data.menu.filter(item => names.includes(item.name));
    } catch {
        return [];
    }
}

// ----------------------------
// Save failed items to disk
// ----------------------------
async function saveFailedItems(failed: MenuItem[]) {
    const names = failed.map(i => i.name);
    await FileSystem.writeAsStringAsync(FAILED_ITEMS_FILE, JSON.stringify(names));
}

// ----------------------------
// Upload image helper with retry
// ----------------------------
async function uploadImageToStorage(imageUrl: string, retries = 2): Promise<string | null> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const fileName = imageUrl.split("/").pop() || `file-${Date.now()}.png`;
            const localPath = `${FILESYSTEM_DIR}${fileName}`;
            const download = await FileSystem.downloadAsync(imageUrl, localPath);

            const fileObj = {
                name: fileName,
                type: "image/png",
                uri: download.uri,
                size: 0,
            };

            const file = await storage.createFile(appwriteConfig.bucketId, ID.unique(), fileObj);
            return storage.getFileViewURL(appwriteConfig.bucketId, file.$id).toString();
        } catch (e) {
            console.warn(`Retry ${attempt} failed for image: ${imageUrl}`);
            if (attempt === retries) return null;
        }
    }
    return null;
}

// ----------------------------
// Seed function with resume
// ----------------------------
export default async function seed() {
    const failedItems: MenuItem[] = [];

    const categoryMap: Record<string,string> = {};
    const customizationMap: Record<string,string> = {};
    const menuMap: Record<string,string> = {};

    // ----------------------------
    // 1️⃣ Create Categories
    // ----------------------------
    for (const cat of data.categories) {
        const existing = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.categoriesCollectionId, [ Query.equal("name", cat.name) ]);
        categoryMap[cat.name] = existing.total > 0 ? existing.documents[0].$id : (await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.categoriesCollectionId, ID.unique(), cat)).$id;
    }

    // ----------------------------
    // 2️⃣ Create Customizations
    // ----------------------------
    for (const cus of data.customizations) {
        const existing = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.customizationCollectionId, [ Query.equal("name", cus.name) ]);
        customizationMap[cus.name] = existing.total > 0 ? existing.documents[0].$id : (await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.customizationCollectionId, ID.unique(), cus)).$id;
    }

    // ----------------------------
    // 3️⃣ Load items to seed (resume mode)
    // ----------------------------
    const itemsToSeed = (await loadFailedItems()).length > 0 ? await loadFailedItems() : data.menu;

    // ----------------------------
    // 4️⃣ Create Menu Items (parallel)
    // ----------------------------
    const parallelLimit = 3;
    for (let i = 0; i < itemsToSeed.length; i += parallelLimit) {
        const batch = itemsToSeed.slice(i, i + parallelLimit);

        await Promise.all(batch.map(async item => {
            try {
                const existing = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.menuCollectionID, [ Query.equal("name", item.name) ]);
                if (existing.total > 0) { menuMap[item.name] = existing.documents[0].$id; return; }

                const uploadedImage = await uploadImageToStorage(item.image_url);
                if (!uploadedImage) {
                    failedItems.push(item);
                    return;
                }

                const doc = await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.menuCollectionID, ID.unique(), {
                    name: item.name,
                    description: item.description,
                    image_url: uploadedImage,
                    price: item.price,
                    rating: item.rating,
                    calories: item.calories,
                    protein: item.protein,
                    categories: categoryMap[item.category_name],
                });

                menuMap[item.name] = doc.$id;

                // Menu customization
                for (const cusName of item.customizations) {
                    const cusId = customizationMap[cusName];
                    if (!cusId) continue;
                    await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.menuCustomizationCollectionId, ID.unique(), {
                        menu: doc.$id,
                        customization: cusId,
                    });
                }

                console.log(`✅ Created menu: ${item.name}`);
            } catch (e: any) {
                failedItems.push(item);
                console.error(`❌ Failed: ${item.name} -> ${e.message}`);
            }
        }));
    }

    // ----------------------------
    // 5️⃣ Save failed items for next run
    // ----------------------------
    await saveFailedItems(failedItems);

    if (failedItems.length > 0) {
        console.log("\n📄 FAILED ITEMS REPORT");
        failedItems.forEach(f => console.log(`❌ ${f.name} -> ${f.image_url}`));
        console.log(`\n⚡ You can re-run seed.ts to retry these items.`);
    } else {
        console.log("\n✅ All items seeded successfully!");
        // Clear failed items file if everything succeeded
        await FileSystem.deleteAsync(FAILED_ITEMS_FILE).catch(()=>{});
    }
}
