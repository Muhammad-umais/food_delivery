import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import cn from "clsx";

import useAppwrite from "@/lib/useAppwrite";
import { getCategories, getMenu } from "@/lib/appwrite";
import { Category, MenuItem } from "@/type";

import CartButton from "@/components/CartButton";
import MenuCard from "@/components/MenuCard";
import SearchBar from "@/components/SearchBar";
import Filter from "@/components/Filter";

const Search = () => {
    const { category, query } = useLocalSearchParams<{
        category?: string;
        query?: string;
    }>();

    const {
        data: menu,
        refetch,
        loading,
    } = useAppwrite<MenuItem[]>({
        fn: getMenu,
        params: { category, query },
    });

    const { data: categories } = useAppwrite<Category[]>({
        fn: getCategories,
    });

    useEffect(() => {
        refetch({ category, query });
    }, [category, query]);

    return (
        <SafeAreaView className="bg-white h-full p-4">
            <FlatList
                data={menu ?? []}
                numColumns={2}
                keyExtractor={(item) => item.$id}
                columnWrapperClassName="gap-7"
                contentContainerClassName="gap-7 px-5 pb-32"
                renderItem={({ item, index }) => {
                    const isLeftColumn = index % 2 === 0;

                    return (
                        <View
                            className={cn(
                                "flex-1 max-w-[48%]",
                                !isLeftColumn && "mt-10"
                            )}
                        >
                            <MenuCard item={item} />
                        </View>
                    );
                }}
                ListHeaderComponent={() => (
                    <View className="my-5 gap-5">
                        <View className="flex-between flex-row w-full">
                            <View>
                                <Text className="small-bold uppercase text-primary">
                                    Search
                                </Text>
                                <Text className="paragraph-semibold text-dark-100">
                                    Find your favorite food
                                </Text>
                            </View>
                            <CartButton />
                        </View>

                        <SearchBar />
                        <Filter categories={categories ?? []} />
                    </View>
                )}
                ListEmptyComponent={() =>
                    !loading && <Text className="text-center">No results</Text>
                }
            />
        </SafeAreaView>
    );
};

export default Search;
