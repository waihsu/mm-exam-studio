export type BrandAsset = {
  id: string;
  label: string;
  imageDataUrl: string;
  isPrimary: boolean;
  createdAt: string;
};

export type BrandAssetListResult = {
  rows: BrandAsset[];
};

export type CreateBrandAssetInput = {
  label: string;
  imageDataUrl: string;
};
