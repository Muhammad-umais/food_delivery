import {Text} from 'react-native'
import {SafeAreaView} from "react-native-safe-area-context";
import useAppwrite from "@/lib/useAppwrite";
import {getMenu} from "@/lib/appwrite";


const Search = () => {
    const { data, refetch, loading } = useAppwrite({
        fn: getMenu, params: {
            category:'',  query:'',  limit: 6, } });

    console.log(data);

    return (
        <SafeAreaView className="bg-white h-full">
        <Text>
            Search
        </Text>
        </SafeAreaView>
    )
}

export default Search