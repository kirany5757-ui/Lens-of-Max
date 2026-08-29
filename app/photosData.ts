import data from "./photosData.json";

export type PhotoData = {
  id: number;
  image: string;
  story: string;
  tags: string[];
  group: string;
  isMain: boolean;
};

export const photos: PhotoData[] = data as PhotoData[];
