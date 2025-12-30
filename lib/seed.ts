import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";
import * as FileSystem from "expo-file-system/legacy";

interface Category {
    name: string;
    description: string;
}

interface Customization {
    name: string;
    price: number;
    type: string;
}

interface MenuItem {
    name: string;
    description: string;
    image_url: string;
    price: number;
    rating: number;
    calories: number;
    protein: number;
    category_name: string;
    customizations: string[];
}

interface DummyData {
    categories: Category[];
    customizations: Customization[];
    menu: MenuItem[];
}

const data = dummyData as DummyData;

// ----------------------
// Clear all documents
// ----------------------
async function clearCollection(collectionId: string) {
    const list = await databases.listDocuments(appwriteConfig.databaseId, collectionId);
    await Promise.all(
        list.documents.map(doc =>
            databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)
        )
    );
}

// ----------------------
// Clear storage files
// ----------------------
async function clearStorage() {
    const list = await storage.listFiles(appwriteConfig.bucketId);
    await Promise.all(list.files.map(file => storage.deleteFile(appwriteConfig.bucketId, file.$id)));
}

// ----------------------
// Upload image and return direct URL
// ----------------------
async function uploadImageToStorage(imageUrl: string): Promise<string> {
    const fileName = imageUrl.split("/").pop() || `file-${Date.now()}.png`;
    const localUri = `${FileSystem.cacheDirectory}${fileName}`;

    // Download image locally first
    const download = await FileSystem.downloadAsync(imageUrl, localUri);

    const fileObj = {
        name: fileName,
        type: "image/png",
        uri: download.uri,
        size: 0,
    };

    const file = await storage.createFile(appwriteConfig.bucketId, ID.unique(), fileObj);

    // Direct file URL (no preview)
    const directUrl = `${storage.getFileViewURL(appwriteConfig.bucketId, file.$id)}&project=${appwriteConfig.projectId}`;
    console.log("Uploaded image direct URL:", directUrl);
    return directUrl;
}

// ----------------------
// Main seed function
// ----------------------
export default async function seed() {
    console.log("🟢 Starting seed...");

    // 1️⃣ Clear previous data
    await clearCollection(appwriteConfig.categoriesCollectionId);
    await clearCollection(appwriteConfig.customizationCollectionId);
    await clearCollection(appwriteConfig.menuCollectionID);
    await clearCollection(appwriteConfig.menuCustomizationCollectionId);
    await clearStorage();

    console.log("🟢 Cleared old data.");

    // 2️⃣ Create categories
    const categoryMap: Record<string, string> = {};
    for (const cat of data.categories) {
        const doc = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId,
            ID.unique(),
            cat
        );
        categoryMap[cat.name] = doc.$id;
    }
    console.log("🟢 Categories created.");

    // 3️⃣ Create customizations
    const customizationMap: Record<string, string> = {};
    for (const cus of data.customizations) {
        const doc = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.customizationCollectionId,
            ID.unique(),
            cus
        );
        customizationMap[cus.name] = doc.$id;
    }
    console.log("🟢 Customizations created.");

    // 4️⃣ Create menu items
    for (const item of data.menu) {
        try {
            const uploadedImage = await uploadImageToStorage(item.image_url);

            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.menuCollectionID,
                ID.unique(),
                {
                    name: item.name,
                    description: item.description,
                    image_url: uploadedImage,
                    price: item.price,
                    rating: item.rating,
                    calories: item.calories,
                    protein: item.protein,
                    categories: categoryMap[item.category_name],
                }
            );

            // 5️⃣ Menu customizations
            for (const cusName of item.customizations) {
                if (!customizationMap[cusName]) continue;
                await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.menuCustomizationCollectionId,
                    ID.unique(),
                    {
                        menu: doc.$id,
                        customization: customizationMap[cusName],
                    }
                );
            }

            console.log(`✅ Created menu item: ${item.name}`);
        } catch (e: any) {
            console.error(`❌ Failed to seed item: ${item.name}`, e.message);
        }
    }

    console.log("🟢 Seed completed!");
}
