import { Text, TouchableOpacity, Image, Platform, View } from 'react-native';
import { MenuItem } from "@/type";
import { appwriteConfig } from "@/lib/appwrite";

const MenuCard = ({ item }: { item: MenuItem }) => {

    // Debug: log the full item and URL
    console.log("MenuCard item received:", item);

    const imageUrl = item.image_url.includes('?project=')
        ? item.image_url
        : `${item.image_url}?project=${appwriteConfig.projectId}`;

    return (
        <TouchableOpacity
            className="menu-card"
            style={Platform.OS === 'android' ? { elevation: 10, shadowColor: '#878787' } : {}}
        >
            <Image
                source={{ uri: imageUrl }} className="size-32 absolute -top-10" resizeMode="contain"/>
            <Text
                className="text-center base-bold text-dark-100 mb-2" numberOfLines={1}>{item.name}
            </Text>
            <Text className="body-regular text-gray-200 mb-4">From ${item.price}
            </Text>
            <TouchableOpacity onPress={() => {}}>
                <Text className="paragraph-bold text-primary">Add to Cart +</Text>
            </TouchableOpacity>

        </TouchableOpacity>
    );
};

export default MenuCard;
