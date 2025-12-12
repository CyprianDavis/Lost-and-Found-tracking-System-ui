export const createItemState = () => ({
  name: "",
  category: "",
  description: "",
  brand: "",
  color: "",
  serialNumber: "",
  identifierMarkings: "",
  imageData: "",
});

export const toOptionalString = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = value.toString().trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const buildItemPayload = (itemState) => {
  const name = toOptionalString(itemState.name);
  const category = toOptionalString(itemState.category);
  if (!name || !category) {
    throw new Error("Item name and category are required.");
  }
  const payload = { name, category };
  ["description", "brand", "color", "serialNumber", "identifierMarkings"].forEach(
    (key) => {
      const value = toOptionalString(itemState[key]);
      if (value) {
        payload[key] = value;
      }
    },
  );
  if (itemState.imageData) {
    payload.imageUrl = itemState.imageData;
  }
  return payload;
};
