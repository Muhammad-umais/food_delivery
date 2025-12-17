import {
    View,
    ImageBackground,
    Image,
    useWindowDimensions,
} from "react-native";
import { Redirect, Slot } from "expo-router";
import { images } from "@/constants";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import useAuthStore from "@/store/auth.store";

export default function Layout() {
    // ✅ ALL hooks first (no conditions)
    const { isAuthenticated } = useAuthStore();
    const { height } = useWindowDimensions();

    // ✅ Conditional rendering AFTER hooks
    if (isAuthenticated) {
        return <Redirect href="/" />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: "white" }}>
            <KeyboardAwareScrollView
                enableOnAndroid
                enableAutomaticScroll
                extraScrollHeight={50}
                keyboardOpeningTime={0}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: 40,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Top Background + Logo */}
                <View
                    className="w-full relative"
                    style={{ height: height / 2.25 }}
                >
                    <ImageBackground
                        source={images.loginGraphic}
                        className="size-full rounded-b-lg"
                        resizeMode="stretch"
                    />

                    <Image
                        source={images.logo}
                        className="self-center size-48 absolute -bottom-16 z-10"
                    />
                </View>

                {/* Auth Screens */}
                <Slot />
            </KeyboardAwareScrollView>
        </View>
    );
}
