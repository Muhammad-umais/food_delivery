import { useEffect, useState } from "react";

type UseAppwriteProps<T> = {
    fn: (params?: any) => Promise<T>;
    params?: any;
};

export default function useAppwrite<T>({ fn, params }: UseAppwriteProps<T>) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async (newParams?: any) => {
        try {
            setLoading(true);
            const res = await fn(newParams ?? params);
            setData(res);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { data, loading, refetch: fetchData };
}
