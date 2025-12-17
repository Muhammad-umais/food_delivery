import {Account, Avatars, Client, Databases, ID, Query} from "react-native-appwrite";
import { CreateUserParams, SignInParams } from "@/type";

export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    platform: "com.dev.fooddelievery",
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    databaseId: "693568c20001d17246ce",
    userCollectionId: "user",
};

export const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
const avatars = new Avatars(client);

// ======================================================
// ⭐ CREATE USER — auto login if new, alert if exists
// ======================================================
export const createUser = async ({ email, password, name }: CreateUserParams) => {
    try {
        // 1️⃣ Create Auth user
        const newAccount = await account.create(ID.unique(), email, password, name);

        // 2️⃣ Avatar URL
        const avatar = avatars.getInitialsURL(name);

        // 3️⃣ Create DB User Record
        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                email,
                name,
                accountId: newAccount.$id,
                avatar,
            }
        );

        // 4️⃣ Auto login new user
        await account.createEmailPasswordSession(email, password);

        return { success: true };
    } catch (e: any) {
        if (e?.code === 409) {
            throw new Error("An account with this email already exists. Kindly log in.");
        }

        throw new Error(e.message);
    }
};

// ======================================================
// ⭐ SIGN IN
// ======================================================
export const signIn = async ({ email, password }: SignInParams) => {
    try {
        await account.createEmailPasswordSession(email, password);
        return { success: true };
    } catch (e: any) {
        throw new Error(e.message);
    }
};

export const getCurrentUser =async () => {

    try {
        const currentAccount=await account.get();
        if(!currentAccount) throw Error;
        const currentUser=await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId',currentAccount.$id)]

        )
        if(!currentUser) throw Error;
        return currentUser.documents[0];
    }
    catch(e) {
        console.log(e);
        throw new Error(e as string);

    }
}