import useFetch from "@services/useFetch";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, Image, Text, View } from "react-native";
import SearchBar from "../../../components/SearchBar";
import { icons } from "../../../constants/icons";
import { images } from "../../../constants/images";

import { fetchMovies } from "@services/api";
import { getTrendingMovies } from "@services/trending";
import { useFocusEffect, useRouter } from "expo-router";
import MovieCard from "../../../components/MovieCard";
import TrendingCard from "../../../components/TrendingCard";

export default function Index() {
  const router = useRouter();

  // Trending is loaded every time Home comes into view (see useFocusEffect below),
  // so searches you just made show up when you come back
  const {
    data: trendingMovies,
    loading: trendingLoading,
    refetch: loadTrending
  } = useFetch(getTrendingMovies, false)

  const {
    data: movies,
    loading: moviesLoading,
    error: moviesError
  } = useFetch(() => fetchMovies({
    query: ''
  }))

  useFocusEffect(
    useCallback(() => {
      loadTrending();
    }, [])
  );

  // Only show the full-screen spinner on the first load, not on every refresh
  const isLoading = moviesLoading || (trendingLoading && !trendingMovies);

  // Everything above the movie grid scrolls together with it as the list header
  const header = (
    <>
      <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" className="mt-10 self-center" />
      ) : moviesError ? (
        <Text className="text-red-500">Error: {moviesError}</Text>
      ) : (
        <View className="flex-1 mt-5">
          <SearchBar onPress={() => router.push("/search")} placeholder="Search For Movies" />

          {/* Trending Movies: horizontal scroll, most-searched first */}
          <View className="mt-10">
            <Text className="text-lg text-white font-bold mb-3">Trending Movies</Text>
            {trendingMovies && trendingMovies.length > 0 ? (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4 mt-3"
                data={trendingMovies}
                contentContainerStyle={{ gap: 26 }}
                renderItem={({ item, index }) => <TrendingCard movie={item} index={index} />}
                keyExtractor={(item) => item.movie_id.toString()}
              />
            ) : (
              <Text className="text-light-300 text-sm mb-4">
                {trendingMovies
                  ? "Nothing trending yet. Search for a few movies and they'll show up here."
                  : "Couldn't load trending movies. Is the dev server running?"}
              </Text>
            )}
          </View>

          <Text className="text-lg text-white font-bold mt-5 mb-3">Latest Movies</Text>
        </View>
      )}
    </>
  );

  return (
    <View className="flex-1 bg-primary">
      <Image source={images.bg} className="absolute w-full z-0" />
      <FlatList
        className="flex-1 px-5 mt-2 pb-32"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 120 }}
        data={isLoading || moviesError ? [] : movies ?? []}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={header}
        numColumns={3}
        columnWrapperStyle={{
          justifyContent: "flex-start",
          gap: 20,
          paddingRight: 5,
          marginBottom: 10
        }}
        renderItem={({ item }) => <MovieCard {...item} />}
      />
    </View>
  );
}
