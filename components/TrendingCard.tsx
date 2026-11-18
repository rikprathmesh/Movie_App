import MaskedViewBase from "@react-native-masked-view/masked-view";
import { Link } from "expo-router";
import type { ComponentType, ReactElement } from "react";
import { Image, Text, TouchableOpacity, View, type ViewProps } from "react-native";
import { images } from "../constants/images";

// The library's type definitions don't fit newer React Native types, so TypeScript
// doesn't see MaskedView as a component. It works at runtime; this just restores its type.
const MaskedView = MaskedViewBase as unknown as ComponentType<ViewProps & { maskElement: ReactElement }>;

const TrendingCard = ({ movie: { movie_id, title, poster_url }, index }: TrendingCardProps) => {
  return (
    <Link href={{ pathname: "/movies/[id]", params: { id: movie_id } }} asChild>
      <TouchableOpacity className="w-32 relative pl-5">
        <Image
          source={{ uri: poster_url }}
          className="w-32 h-48 rounded-lg"
          resizeMode="cover"
        />

        {/* Big ranking number (1, 2, 3...) filled with the gradient image */}
        <View className="absolute bottom-9 -left-3.5 px-2 py-1 rounded-full">
          <MaskedView
            maskElement={<Text className="font-bold text-white text-6xl">{index + 1}</Text>}
          >
            <Image source={images.rankingGradient} className="size-14" resizeMode="cover" />
          </MaskedView>
        </View>

        <Text className="text-sm font-bold mt-2 text-light-200" numberOfLines={2}>
          {title}
        </Text>
      </TouchableOpacity>
    </Link>
  );
};

export default TrendingCard;
