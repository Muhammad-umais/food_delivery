import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    FlatList,
    Text,
    TouchableOpacity,
    Animated,
} from "react-native";
import { Category } from "@/type";
import { router, useLocalSearchParams } from "expo-router";
import cn from "clsx";

type FilterItem = Category | { $id: string; name: string };

const Filter = ({ categories }: { categories: Category[] }) => {
    const params = useLocalSearchParams<{ category?: string }>();
    const flatListRef = useRef<FlatList>(null);

    const [active, setActive] = useState(params.category ?? "all");
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const data: FilterItem[] = useMemo(
        () => [{ $id: "all", name: "All" }, ...categories],
        [categories]
    );

    const onPress = useCallback(
        (id: string, index: number) => {
            setActive(id);

            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 80,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 80,
                    useNativeDriver: true,
                }),
            ]).start();

            if (id === "all") {
                router.setParams({ category: undefined });
            } else {
                router.setParams({ category: id });
            }

            flatListRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.5,
            });
        },
        []
    );

    return (
        <FlatList
            ref={flatListRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            data={data}
            keyExtractor={(item) => item.$id}
            contentContainerClassName="gap-x-3 pb-4"
            renderItem={({ item, index }) => {
                const isActive = active === item.$id;

                return (
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <TouchableOpacity
                            onPress={() => onPress(item.$id, index)}
                            activeOpacity={0.85}
                            className={cn(
                                "px-5 py-2 rounded-full border",
                                isActive
                                    ? "bg-amber-500 border-amber-500"
                                    : "bg-white border-gray-200"
                            )}
                        >
                            <Text
                                className={cn(
                                    "body-medium",
                                    isActive
                                        ? "text-white"
                                        : "text-gray-500"
                                )}
                            >
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                );
            }}
        />
    );
};

export default Filter;
